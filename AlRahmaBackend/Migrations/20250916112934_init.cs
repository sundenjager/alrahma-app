using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlRahmaBackend.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActImmCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActImmCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommitteePVs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Committee = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DocumentPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommitteePVs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Deliberations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DocumentPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Deliberations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Dons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Usage = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DateOfEntry = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    DateOfExit = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "صالح"),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LegalFilePath = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Nature = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DonsType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "نقدي"),
                    DonsScope = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "عمومي"),
                    MonetaryValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TestatorNationality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TestamentNature = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TestamentStatus = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RegistrationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExecutionDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EquipmentCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MedicalEquipments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Usage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateOfEntry = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MonetaryValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Brand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateOfExit = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AcquisitionType = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "مساعدات/هبات/تبرعات"),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "صالح"),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LegalFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicalEquipments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Members",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Lastname = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cin = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Numcard = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nationality = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BirthDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Work = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateOfMembership = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsVolunteering = table.Column<bool>(type: "bit", nullable: false),
                    VolunteerField = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MemberType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Members", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OngoingProjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OriginalProgramId = table.Column<int>(type: "int", nullable: false),
                    Project = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ProjectCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Period = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Place = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Beneficiaries = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    BeneficiariesCount = table.Column<int>(type: "int", nullable: true),
                    TargetGroup = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Budget = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BudgetSource = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FundingStatus = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ImplementationStatus = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ProjectManager = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ContactPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Committee = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Year = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BudgetCommentary = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Spent = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Remaining = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OngoingProjects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Sessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SessionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsElectoral = table.Column<bool>(type: "bit", nullable: false),
                    ProgramsFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BudgetFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FinancialReportFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LiteraryReportFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AuditorReportFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NewspaperAnnouncementFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneralSessionPVFilePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewspaperReportFilePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttendeeListFilePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MembersAttendeeFilePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SuggestedPrograms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Project = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ProjectCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Period = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Place = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Beneficiaries = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BeneficiariesCount = table.Column<int>(type: "int", nullable: true),
                    TargetGroup = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Budget = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BudgetSource = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FundingStatus = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ImplementationStatus = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StatusComment = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BudgetCommentary = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: ""),
                    ProjectManager = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactPhone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Committee = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Year = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RefusalCommentary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DecisionDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuggestedPrograms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SuppliesCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuppliesCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WaitingListEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaitingListEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ActImms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MonetaryValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UsageLocation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SourceNature = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DateOfDeployment = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateOfEnd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LegalFilePath = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActImms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActImms_ActImmCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "ActImmCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Attendees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CommitteePVId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attendees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attendees_CommitteePVs_CommitteePVId",
                        column: x => x.CommitteePVId,
                        principalTable: "CommitteePVs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PVPoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "pending"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CommitteePVId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PVPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PVPoints_CommitteePVs_CommitteePVId",
                        column: x => x.CommitteePVId,
                        principalTable: "CommitteePVs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Decisions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DecisionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "pending"),
                    Committee = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RelatedTo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RelatedType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    NewBudget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Commentary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Members = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeliberationId = table.Column<int>(type: "int", nullable: false),
                    DecisionTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DecisionNature = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CancellationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExecutionDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Decisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Decisions_Deliberations_DeliberationId",
                        column: x => x.DeliberationId,
                        principalTable: "Deliberations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DeliberationAttendees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DeliberationId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliberationAttendees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliberationAttendees_Deliberations_DeliberationId",
                        column: x => x.DeliberationId,
                        principalTable: "Deliberations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EquipmentDispatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DispatchDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    ReturnDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Beneficiary = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PatientPhone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PatientCIN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Coordinator = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponsiblePerson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponsiblePersonPhone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponsiblePersonCIN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReturnNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MedicalEquipmentId = table.Column<int>(type: "int", nullable: false),
                    EquipmentReference = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentDispatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EquipmentDispatches_MedicalEquipments_MedicalEquipmentId",
                        column: x => x.MedicalEquipmentId,
                        principalTable: "MedicalEquipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MembershipHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MemberId = table.Column<int>(type: "int", nullable: true),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CardNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MemberId1 = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MembershipHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MembershipHistories_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MembershipHistories_Members_MemberId1",
                        column: x => x.MemberId1,
                        principalTable: "Members",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Aids",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Usage = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DateOfAid = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LegalFilePath = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    AidType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "نقدي"),
                    OngoingProjectId = table.Column<int>(type: "int", nullable: true),
                    MonetaryValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Aids", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Aids_OngoingProjects_OngoingProjectId",
                        column: x => x.OngoingProjectId,
                        principalTable: "OngoingProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Supplies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Usage = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DateOfEntry = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateOfExit = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "صالح"),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LegalFilePath = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    SuppliesType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "نقدي"),
                    SuppliesScope = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "عمومي"),
                    SuppliesNature = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Donation"),
                    MonetaryValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OngoingProjectId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supplies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Supplies_OngoingProjects_OngoingProjectId",
                        column: x => x.OngoingProjectId,
                        principalTable: "OngoingProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DocumentTrackings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProofFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentTrackings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentTrackings_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionCandidates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Position = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CandidateFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionCandidates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionCandidates_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionDocuments_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionGuests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Position = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Organization = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionGuests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionGuests_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Phases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Budget = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SuggestedProgramId = table.Column<int>(type: "int", nullable: true),
                    OngoingProjectId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Phases", x => x.Id);
                    table.CheckConstraint("CK_Phase_SingleProgram", "CASE WHEN [SuggestedProgramId] IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN [OngoingProjectId] IS NOT NULL THEN 1 ELSE 0 END = 1");
                    table.ForeignKey(
                        name: "FK_Phases_OngoingProjects_OngoingProjectId",
                        column: x => x.OngoingProjectId,
                        principalTable: "OngoingProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Phases_SuggestedPrograms_SuggestedProgramId",
                        column: x => x.SuggestedProgramId,
                        principalTable: "SuggestedPrograms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProgramPartners",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactPhone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContributionAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ContributionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SuggestedProgramId = table.Column<int>(type: "int", nullable: true),
                    OngoingProjectId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgramPartners", x => x.Id);
                    table.CheckConstraint("CK_Partner_SingleProgram", "CASE WHEN [SuggestedProgramId] IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN [OngoingProjectId] IS NOT NULL THEN 1 ELSE 0 END = 1");
                    table.ForeignKey(
                        name: "FK_ProgramPartners_OngoingProjects_OngoingProjectId",
                        column: x => x.OngoingProjectId,
                        principalTable: "OngoingProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProgramPartners_SuggestedPrograms_SuggestedProgramId",
                        column: x => x.SuggestedProgramId,
                        principalTable: "SuggestedPrograms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SuppliesSubCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SuppliesCategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuppliesSubCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SuppliesSubCategories_SuppliesCategories_SuppliesCategoryId",
                        column: x => x.SuppliesCategoryId,
                        principalTable: "SuppliesCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "pending"),
                    PhaseId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tasks_Phases_PhaseId",
                        column: x => x.PhaseId,
                        principalTable: "Phases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AidItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AidId = table.Column<int>(type: "int", nullable: false),
                    SuppliesSubCategoryId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AidItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AidItems_Aids_AidId",
                        column: x => x.AidId,
                        principalTable: "Aids",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AidItems_SuppliesSubCategories_SuppliesSubCategoryId",
                        column: x => x.SuppliesSubCategoryId,
                        principalTable: "SuppliesSubCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Stocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SuppliesSubCategoryId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    TotalValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Stocks_SuppliesSubCategories_SuppliesSubCategoryId",
                        column: x => x.SuppliesSubCategoryId,
                        principalTable: "SuppliesSubCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SuppliesItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    SuppliesSubCategoryId = table.Column<int>(type: "int", nullable: false),
                    SuppliesId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuppliesItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SuppliesItems_SuppliesSubCategories_SuppliesSubCategoryId",
                        column: x => x.SuppliesSubCategoryId,
                        principalTable: "SuppliesSubCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SuppliesItems_Supplies_SuppliesId",
                        column: x => x.SuppliesId,
                        principalTable: "Supplies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskMembers",
                columns: table => new
                {
                    TaskId = table.Column<int>(type: "int", nullable: false),
                    MemberName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskMembers", x => new { x.TaskId, x.MemberName });
                    table.ForeignKey(
                        name: "FK_TaskMembers_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StockTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StockId = table.Column<int>(type: "int", nullable: false),
                    QuantityChange = table.Column<int>(type: "int", nullable: false),
                    ValueChange = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    SuppliesId = table.Column<int>(type: "int", nullable: true),
                    AidId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StockTransactions_Aids_AidId",
                        column: x => x.AidId,
                        principalTable: "Aids",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StockTransactions_Stocks_StockId",
                        column: x => x.StockId,
                        principalTable: "Stocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StockTransactions_Supplies_SuppliesId",
                        column: x => x.SuppliesId,
                        principalTable: "Supplies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActImmCategories_Name",
                table: "ActImmCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActImms_CategoryId",
                table: "ActImms",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ActImms_DateOfDeployment",
                table: "ActImms",
                column: "DateOfDeployment");

            migrationBuilder.CreateIndex(
                name: "IX_ActImms_IsActive",
                table: "ActImms",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ActImms_Number",
                table: "ActImms",
                column: "Number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActImms_SourceNature",
                table: "ActImms",
                column: "SourceNature");

            migrationBuilder.CreateIndex(
                name: "IX_ActImms_Status",
                table: "ActImms",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AidItems_AidId",
                table: "AidItems",
                column: "AidId");

            migrationBuilder.CreateIndex(
                name: "IX_AidItems_SuppliesSubCategoryId",
                table: "AidItems",
                column: "SuppliesSubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Aids_AidType",
                table: "Aids",
                column: "AidType");

            migrationBuilder.CreateIndex(
                name: "IX_Aids_DateOfAid",
                table: "Aids",
                column: "DateOfAid");

            migrationBuilder.CreateIndex(
                name: "IX_Aids_OngoingProjectId",
                table: "Aids",
                column: "OngoingProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Aids_Reference",
                table: "Aids",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Aids_Usage",
                table: "Aids",
                column: "Usage");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Attendees_CommitteePVId",
                table: "Attendees",
                column: "CommitteePVId");

            migrationBuilder.CreateIndex(
                name: "IX_CommitteePVs_Committee",
                table: "CommitteePVs",
                column: "Committee");

            migrationBuilder.CreateIndex(
                name: "IX_CommitteePVs_DateTime",
                table: "CommitteePVs",
                column: "DateTime");

            migrationBuilder.CreateIndex(
                name: "IX_CommitteePVs_Number",
                table: "CommitteePVs",
                column: "Number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Decisions_DeliberationId",
                table: "Decisions",
                column: "DeliberationId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliberationAttendees_DeliberationId",
                table: "DeliberationAttendees",
                column: "DeliberationId");

            migrationBuilder.CreateIndex(
                name: "IX_Deliberations_DateTime",
                table: "Deliberations",
                column: "DateTime");

            migrationBuilder.CreateIndex(
                name: "IX_Deliberations_Number",
                table: "Deliberations",
                column: "Number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTrackings_SessionId",
                table: "DocumentTrackings",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Dons_Category",
                table: "Dons",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Dons_DateOfEntry",
                table: "Dons",
                column: "DateOfEntry");

            migrationBuilder.CreateIndex(
                name: "IX_Dons_DonsType",
                table: "Dons",
                column: "DonsType");

            migrationBuilder.CreateIndex(
                name: "IX_Dons_Reference",
                table: "Dons",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Dons_Status",
                table: "Dons",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentCategories_Name",
                table: "EquipmentCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentDispatches_MedicalEquipmentId",
                table: "EquipmentDispatches",
                column: "MedicalEquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalEquipments_Reference",
                table: "MedicalEquipments",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Members_Cin",
                table: "Members",
                column: "Cin",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MembershipHistories_CardNumber",
                table: "MembershipHistories",
                column: "CardNumber");

            migrationBuilder.CreateIndex(
                name: "IX_MembershipHistories_MemberId",
                table: "MembershipHistories",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MembershipHistories_MemberId1",
                table: "MembershipHistories",
                column: "MemberId1");

            migrationBuilder.CreateIndex(
                name: "IX_OngoingProjects_Committee",
                table: "OngoingProjects",
                column: "Committee");

            migrationBuilder.CreateIndex(
                name: "IX_OngoingProjects_ImplementationStatus",
                table: "OngoingProjects",
                column: "ImplementationStatus");

            migrationBuilder.CreateIndex(
                name: "IX_OngoingProjects_ProjectCode",
                table: "OngoingProjects",
                column: "ProjectCode");

            migrationBuilder.CreateIndex(
                name: "IX_OngoingProjects_Year",
                table: "OngoingProjects",
                column: "Year");

            migrationBuilder.CreateIndex(
                name: "IX_Phases_OngoingProjectId",
                table: "Phases",
                column: "OngoingProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Phases_SuggestedProgramId",
                table: "Phases",
                column: "SuggestedProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgramPartners_OngoingProjectId",
                table: "ProgramPartners",
                column: "OngoingProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgramPartners_SuggestedProgramId",
                table: "ProgramPartners",
                column: "SuggestedProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_PVPoints_CommitteePVId",
                table: "PVPoints",
                column: "CommitteePVId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionCandidates_SessionId",
                table: "SessionCandidates",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionDocuments_SessionId_DocumentType",
                table: "SessionDocuments",
                columns: new[] { "SessionId", "DocumentType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionGuests_SessionId",
                table: "SessionGuests",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_SessionDate",
                table: "Sessions",
                column: "SessionDate");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_SessionType",
                table: "Sessions",
                column: "SessionType");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_Status",
                table: "Sessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_LastUpdated",
                table: "Stocks",
                column: "LastUpdated");

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_Quantity",
                table: "Stocks",
                column: "Quantity");

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_SuppliesSubCategoryId",
                table: "Stocks",
                column: "SuppliesSubCategoryId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockTransactions_AidId",
                table: "StockTransactions",
                column: "AidId");

            migrationBuilder.CreateIndex(
                name: "IX_StockTransactions_StockId",
                table: "StockTransactions",
                column: "StockId");

            migrationBuilder.CreateIndex(
                name: "IX_StockTransactions_SuppliesId",
                table: "StockTransactions",
                column: "SuppliesId");

            migrationBuilder.CreateIndex(
                name: "IX_StockTransactions_TransactionDate",
                table: "StockTransactions",
                column: "TransactionDate");

            migrationBuilder.CreateIndex(
                name: "IX_StockTransactions_TransactionType",
                table: "StockTransactions",
                column: "TransactionType");

            migrationBuilder.CreateIndex(
                name: "IX_SuggestedPrograms_Committee",
                table: "SuggestedPrograms",
                column: "Committee");

            migrationBuilder.CreateIndex(
                name: "IX_SuggestedPrograms_FundingStatus",
                table: "SuggestedPrograms",
                column: "FundingStatus");

            migrationBuilder.CreateIndex(
                name: "IX_SuggestedPrograms_ImplementationStatus",
                table: "SuggestedPrograms",
                column: "ImplementationStatus");

            migrationBuilder.CreateIndex(
                name: "IX_SuggestedPrograms_Year",
                table: "SuggestedPrograms",
                column: "Year");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_DateOfEntry",
                table: "Supplies",
                column: "DateOfEntry");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_DateOfExit",
                table: "Supplies",
                column: "DateOfExit");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_OngoingProjectId",
                table: "Supplies",
                column: "OngoingProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_Reference",
                table: "Supplies",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_Source",
                table: "Supplies",
                column: "Source");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_Status",
                table: "Supplies",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_SuppliesNature",
                table: "Supplies",
                column: "SuppliesNature");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_SuppliesScope",
                table: "Supplies",
                column: "SuppliesScope");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_SuppliesType",
                table: "Supplies",
                column: "SuppliesType");

            migrationBuilder.CreateIndex(
                name: "IX_Supplies_Usage",
                table: "Supplies",
                column: "Usage");

            migrationBuilder.CreateIndex(
                name: "IX_SuppliesItems_SuppliesId",
                table: "SuppliesItems",
                column: "SuppliesId");

            migrationBuilder.CreateIndex(
                name: "IX_SuppliesItems_SuppliesSubCategoryId",
                table: "SuppliesItems",
                column: "SuppliesSubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SuppliesSubCategories_SuppliesCategoryId",
                table: "SuppliesSubCategories",
                column: "SuppliesCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_PhaseId",
                table: "Tasks",
                column: "PhaseId");

            migrationBuilder.CreateIndex(
                name: "IX_WaitingListEntries_CreatedAt",
                table: "WaitingListEntries",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_WaitingListEntries_Date",
                table: "WaitingListEntries",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_WaitingListEntries_Status",
                table: "WaitingListEntries",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActImms");

            migrationBuilder.DropTable(
                name: "AidItems");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "Attendees");

            migrationBuilder.DropTable(
                name: "Decisions");

            migrationBuilder.DropTable(
                name: "DeliberationAttendees");

            migrationBuilder.DropTable(
                name: "DocumentTrackings");

            migrationBuilder.DropTable(
                name: "Dons");

            migrationBuilder.DropTable(
                name: "EquipmentCategories");

            migrationBuilder.DropTable(
                name: "EquipmentDispatches");

            migrationBuilder.DropTable(
                name: "MembershipHistories");

            migrationBuilder.DropTable(
                name: "ProgramPartners");

            migrationBuilder.DropTable(
                name: "PVPoints");

            migrationBuilder.DropTable(
                name: "SessionCandidates");

            migrationBuilder.DropTable(
                name: "SessionDocuments");

            migrationBuilder.DropTable(
                name: "SessionGuests");

            migrationBuilder.DropTable(
                name: "StockTransactions");

            migrationBuilder.DropTable(
                name: "SuppliesItems");

            migrationBuilder.DropTable(
                name: "TaskMembers");

            migrationBuilder.DropTable(
                name: "WaitingListEntries");

            migrationBuilder.DropTable(
                name: "ActImmCategories");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Deliberations");

            migrationBuilder.DropTable(
                name: "MedicalEquipments");

            migrationBuilder.DropTable(
                name: "Members");

            migrationBuilder.DropTable(
                name: "CommitteePVs");

            migrationBuilder.DropTable(
                name: "Sessions");

            migrationBuilder.DropTable(
                name: "Aids");

            migrationBuilder.DropTable(
                name: "Stocks");

            migrationBuilder.DropTable(
                name: "Supplies");

            migrationBuilder.DropTable(
                name: "Tasks");

            migrationBuilder.DropTable(
                name: "SuppliesSubCategories");

            migrationBuilder.DropTable(
                name: "Phases");

            migrationBuilder.DropTable(
                name: "SuppliesCategories");

            migrationBuilder.DropTable(
                name: "OngoingProjects");

            migrationBuilder.DropTable(
                name: "SuggestedPrograms");
        }
    }
}
