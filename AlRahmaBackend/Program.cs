// AlRahmaBackend/Program.cs

using System;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.Repositories;
using AlRahmaBackend.Interfaces;
using AlRahmaBackend.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Database Context
builder.Services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    if (builder.Environment.IsDevelopment())
    {
        // Use SQL Server for development
        options.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30));
        });
    }
    else
    {
        // Use PostgreSQL for production (Render)
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5));
        });
    }
    
    options.EnableDetailedErrors(builder.Environment.IsDevelopment());
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
});


// Add Identity services with enhanced security
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => 
{
    // Enhanced password policy
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = builder.Environment.IsProduction() ? 12 : 8;
    options.Password.RequiredUniqueChars = 1;
    
    // Enhanced lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
    
    options.User.RequireUniqueEmail = true;
    
    // Enhanced sign-in requirements
    options.SignIn.RequireConfirmedAccount = true;
    options.SignIn.RequireConfirmedEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure CORS with enhanced security - MUST BE BEFORE AUTHENTICATION
builder.Services.AddCors(options =>
{
    options.AddPolicy("RenderPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:5273")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins("https://alrahma-frontend.onrender.com")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});


// Configure JWT Authentication with legacy token handler for compatibility
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtKey = builder.Configuration["Jwt:Key"];
    if (string.IsNullOrEmpty(jwtKey))
    {
        throw new InvalidOperationException("JWT Key is not configured in appsettings.json");
    }

    // CRITICAL FIX: Use legacy token handler to avoid Base64UrlEncoder issues
    options.UseSecurityTokenValidators = true;
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero,
        // Add these for better compatibility
        RequireExpirationTime = true,
        RequireSignedTokens = true
    };

    // Simplified event handling to avoid middleware conflicts
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Allow OPTIONS requests (preflight) without authentication
            if (context.Request.Method == "OPTIONS")
            {
                context.NoResult();
                return Task.CompletedTask;
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            var userId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = context.Principal?.FindFirst(ClaimTypes.Role)?.Value;
            logger.LogInformation("Token validated successfully for user {UserId} with role {Role}", userId, userRole);
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("JWT Authentication failed: {Error}", context.Exception.Message);
            logger.LogError("Token: {Token}", context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "").Substring(0, Math.Min(20, context.Request.Headers["Authorization"].ToString().Length - 7)) + "...");
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            // Skip default challenge to avoid response already started error
            context.HandleResponse();
            
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("JWT Challenge for {Path} - returning 401", context.Request.Path);
            
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            var result = JsonSerializer.Serialize(new { 
                message = "Unauthorized", 
                error = "Invalid or missing token" 
            });
            return context.Response.WriteAsync(result);
        }
    };
});

// Add Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireSuperAdminRole", policy => 
        policy.RequireRole("SuperAdmin"));
        
    options.AddPolicy("RequireAdminRole", policy => 
        policy.RequireRole("SuperAdmin", "Admin"));
        
    options.AddPolicy("RequireUserRole", policy => 
        policy.RequireRole("SuperAdmin", "Admin", "User"));
        
    options.AddPolicy("ReadOnlyAccess", policy => 
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == ClaimTypes.Role && 
                new[] { "SuperAdmin", "Admin", "User" }.Contains(c.Value))));
                
    // Default policy for all authenticated users
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// Configure JSON Options
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// Configure file upload size limits with reasonable defaults
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 50 * 1024 * 1024; // 50MB
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 50 * 1024 * 1024; // 50MB
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 50 * 1024 * 1024; // 50MB
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

// Controllers with enhanced security
builder.Services.AddControllers()
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    
});

// Swagger/OpenAPI with enhanced security
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { 
        Title = "AlRahmaBackend API", 
        Version = "v1",
        Description = "Secure API for AlRahma Backend",
        Contact = new OpenApiContact { Name = "AlRahma", Email = "admin@alrahma.com" }
    });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
    
    // Only show sensitive info in development
    if (!builder.Environment.IsDevelopment())
    {
        c.IgnoreObsoleteActions();
        c.IgnoreObsoleteProperties();
    }
});

// Register repositories and services
builder.Services.AddScoped<ISuggestedProgramRepository, SuggestedProgramRepository>();
builder.Services.AddScoped<ISuggestedProgramService, SuggestedProgramService>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<IMedicalEquipmentService, MedicalEquipmentService>();
builder.Services.AddScoped<IEquipmentDispatchService, EquipmentDispatchService>();
builder.Services.AddScoped<IEquipmentCategoryService, EquipmentCategoryService>();
builder.Services.AddScoped<IOngoingProjectRepository, OngoingProjectRepository>();
builder.Services.AddScoped<OngoingProjectService>();
builder.Services.AddScoped<StockHelperService>();
builder.Services.AddScoped<AidStockHelperService>();

// Add UserManager and RoleManager
builder.Services.AddScoped<UserManager<ApplicationUser>>();
builder.Services.AddScoped<RoleManager<IdentityRole>>();

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMemberService, MemberService>();

builder.Services.AddHttpContextAccessor();

// Configure security headers
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

// Build application
var app = builder.Build();

// TEMPORARILY DISABLED: Remove security headers middleware to fix JWT issue
// The security headers were causing middleware conflicts
// We'll add them back after fixing authentication

// Middleware pipeline - CRITICAL ORDER!
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AlRahmaBackend API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "AlRahmaBackend API - Development";
    });
    
    // Development-specific security relaxations
    app.UseDeveloperExceptionPage();
}
else
{
    // Production security settings
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

// CORS MUST COME BEFORE AUTHENTICATION AND AUTHORIZATION
app.UseCors("RenderPolicy");

app.UseAuthentication();
app.UseAuthorization();

// Enhanced static file security
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.WebRootPath, "Uploads")),
    RequestPath = "/Uploads",
    OnPrepareResponse = ctx =>
    {
        // Cache PDF files
        if (ctx.File.Name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000");
        }
        else
        {
            // Require authentication for non-PDF files
            if (ctx.Context.User.Identity?.IsAuthenticated != true)
            {
                ctx.Context.Response.StatusCode = 401;
                return;
            }
            // No cache for other authenticated files
            ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store");
            ctx.Context.Response.Headers.Append("Pragma", "no-cache");
        }
    }
});

// Error handling endpoint
app.Map("/error", () => Results.Problem("An error occurred."))
   .AllowAnonymous();

// Add a test endpoint for CORS verification
app.MapGet("/api/test-cors", () => 
{
    return Results.Ok(new { 
        message = "CORS test successful", 
        timestamp = DateTime.UtcNow,
        status = "API is running correctly"
    });
}).AllowAnonymous(); // Allow anonymous access for testing

// FIXED: Use explicit routing to avoid middleware conflicts
app.UseRouting();
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

// Database initialization and seeding
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        await context.Database.MigrateAsync();
        
        await SeedInitialAdminUser(services);
        
        // Log successful initialization
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Database migrated and seeded successfully");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or seeding the database");
        
        if (app.Environment.IsProduction())
        {
            throw;
        }
    }
}

// Seed initial admin user
static async Task SeedInitialAdminUser(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Create roles if they don't exist
        var roles = new[] { "SuperAdmin", "Admin", "User" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Created role: {Role}", role);
            }
        }

        var adminEmail = "admin@alrahma.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                PhoneNumber = "+1234567890",
                IsActive = true,
                IsApproved = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow,
                Role = "SuperAdmin"
            };

            var createResult = await userManager.CreateAsync(adminUser, "Admin@123");
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "SuperAdmin");
                logger.LogInformation("Admin user created successfully");
            }
            else
            {
                logger.LogError("Failed to create admin user: {Errors}", 
                    string.Join(", ", createResult.Errors.Select(e => e.Description)));
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while seeding admin user");
    }
}

app.Run();