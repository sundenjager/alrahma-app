using Microsoft.EntityFrameworkCore;
using AlRahmaBackend.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace AlRahmaBackend.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Member Management
        public DbSet<Member> Members { get; set; }
        public DbSet<MembershipHistory> MembershipHistories { get; set; }
        public DbSet<SuggestedProgram> SuggestedPrograms { get; set; }
        public DbSet<ProgramPartner> ProgramPartners { get; set; }

        // Session Management
        public DbSet<Session> Sessions { get; set; }
        public DbSet<SessionDocument> SessionDocuments { get; set; }
        public DbSet<SessionGuest> SessionGuests { get; set; }
        public DbSet<DocumentTracking> DocumentTrackings { get; set; }
        public DbSet<SessionCandidate> SessionCandidates { get; set; }
        public DbSet<Phase> Phases { get; set; }
        public DbSet<ProjectTask> Tasks { get; set; }
        public DbSet<MedicalEquipment> MedicalEquipments { get; set; }
        public DbSet<EquipmentDispatch> EquipmentDispatches { get; set; }
        public DbSet<EquipmentCategory> EquipmentCategories { get; set; }
        public DbSet<Dons> Dons { get; set; }
        public DbSet<Supplies> Supplies { get; set; }
        public DbSet<Aid> Aids { get; set; }
        public DbSet<AidItem> AidItems { get; set; }
        public DbSet<ActImm> ActImms { get; set; }
        public DbSet<ActImmCategory> ActImmCategories { get; set; }
        
        public DbSet<SuppliesCategory> SuppliesCategories { get; set; }
        public DbSet<SuppliesSubCategory> SuppliesSubCategories { get; set; }
        public DbSet<SuppliesItem> SuppliesItems { get; set; }

        public DbSet<Stock> Stocks { get; set; }
        public DbSet<StockTransaction> StockTransactions { get; set; }

        public DbSet<WaitingListEntry> WaitingListEntries { get; set; }


        public DbSet<CommitteePV> CommitteePVs { get; set; }
        public DbSet<Attendee> Attendees { get; set; }

        public DbSet<OngoingProject> OngoingProjects { get; set; }
        
        public DbSet<Deliberation> Deliberations { get; set; }
        public DbSet<DeliberationAttendee> DeliberationAttendees { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure ApplicationUser
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.Role).HasMaxLength(50);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsApproved).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            ConfigureMemberEntities(builder);
            ConfigureMembershipHistoryEntities(builder);
            ConfigureSuggestedProgramEntities(builder);
            ConfigureSessionEntities(builder);
            ConfigurePhaseEntities(builder);
            ConfigureDocumentTrackingEntities(builder);
            ConfigureMedicalEquipmentEntities(builder);
            ConfigureDonsEntities(builder);
            ConfigureActImmEntities(builder);
            ConfigureSuppliesEntities(builder);
            ConfigureSuppliesCategoryEntities(builder);
            ConfigureAidEntities(builder);
            ConfigureStockEntities(builder);
            ConfigureOngoingProjectEntities(builder);

            builder.Entity<WaitingListEntry>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Address).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Reason).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("pending");
                entity.Property(e => e.CreatedAt)
                    .IsRequired()
                    .HasDefaultValueSql("GETUTCDATE()");
                
                // إضافة فهارس للبحث السريع
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.CreatedAt);
            });


            builder.Entity<CommitteePV>(entity =>
            {
                entity.ToTable("CommitteePVs"); // Explicit table naming

                entity.HasIndex(pv => pv.Number).IsUnique();
                entity.HasIndex(pv => pv.Committee);
                entity.HasIndex(pv => pv.DateTime);

                entity.Property(pv => pv.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasMany(pv => pv.Attendees)
                    .WithOne(a => a.CommitteePV)
                    .HasForeignKey(a => a.CommitteePVId)
                    .OnDelete(DeleteBehavior.Cascade);

            });

            builder.Entity<Attendee>(entity =>
            {
                entity.ToTable("Attendees");
                entity.Property(a => a.Name).HasMaxLength(100);
            });



            builder.Entity<Phase>(entity =>
            {
                entity.HasOne(p => p.SuggestedProgram)
                    .WithMany(p => p.Phases)
                    .HasForeignKey(p => p.SuggestedProgramId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false);

                entity.HasOne(p => p.OngoingProject)
                    .WithMany(p => p.Phases)
                    .HasForeignKey(p => p.OngoingProjectId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false);

                // Add check constraint
                entity.HasCheckConstraint(
                    "CK_Phase_SingleProgram",
                    "CASE WHEN [SuggestedProgramId] IS NOT NULL THEN 1 ELSE 0 END + " +
                    "CASE WHEN [OngoingProjectId] IS NOT NULL THEN 1 ELSE 0 END = 1");
            });

            builder.Entity<Deliberation>(entity =>
            {
                entity.ToTable("Deliberations");

                entity.HasIndex(d => d.Number).IsUnique();
                entity.HasIndex(d => d.DateTime);

                entity.Property(d => d.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasMany(d => d.Attendees)
                    .WithOne(a => a.Deliberation)
                    .HasForeignKey(a => a.DeliberationId)
                    .OnDelete(DeleteBehavior.Cascade);

            });
                    
            builder.Entity<DeliberationAttendee>(entity =>
            {
                entity.ToTable("DeliberationAttendees");
                entity.Property(a => a.Name).HasMaxLength(100);
            });



            builder.Entity<SuggestedProgram>()
                .Property(p => p.RefusalCommentary)
                .IsRequired(false);

            builder.Entity<SuggestedProgram>()
                .Property(p => p.BudgetCommentary)
                .HasDefaultValue(string.Empty);
            
            


            builder.Entity<ProgramPartner>(entity =>
            {
                entity.HasOne(p => p.SuggestedProgram)
                    .WithMany(p => p.Partners)
                    .HasForeignKey(p => p.SuggestedProgramId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false);

                entity.HasOne(p => p.OngoingProject)
                    .WithMany(p => p.Partners)
                    .HasForeignKey(p => p.OngoingProjectId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false);

                // Add check constraint
                entity.HasCheckConstraint(
                    "CK_Partner_SingleProgram",
                    "CASE WHEN [SuggestedProgramId] IS NOT NULL THEN 1 ELSE 0 END + " +
                    "CASE WHEN [OngoingProjectId] IS NOT NULL THEN 1 ELSE 0 END = 1");
            });
        }

        // Add this method if it doesn't exist
        private void ConfigureOngoingProjectEntities(ModelBuilder builder)
        {
            builder.Entity<OngoingProject>(entity =>
            {
                entity.HasKey(op => op.Id);
                
                // Configure relationship with Aid
                entity.HasMany(op => op.Aids)
                    .WithOne(a => a.OngoingProject)
                    .HasForeignKey(a => a.OngoingProjectId)
                    .OnDelete(DeleteBehavior.SetNull);
                    
                // Add other OngoingProject configurations as needed
                entity.HasIndex(op => op.ProjectCode).IsUnique(false);
                entity.HasIndex(op => op.Committee);
                entity.HasIndex(op => op.Year);
                entity.HasIndex(op => op.ImplementationStatus);
            });
        }

        private void ConfigureMemberEntities(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Member>(entity =>
            {
                entity.HasIndex(m => m.Cin).IsUnique();
                entity.HasMany(m => m.MembershipHistories)
                    .WithOne(mh => mh.Member)
                    .HasForeignKey(mh => mh.MemberId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<MembershipHistory>()
                .HasIndex(mh => mh.MemberId);
        }

        private void ConfigureStockEntities(ModelBuilder builder)
        {
            builder.Entity<Stock>(entity =>
            {
                entity.HasKey(s => s.Id);
                
                entity.HasOne(s => s.SuppliesSubCategory)
                    .WithMany()
                    .HasForeignKey(s => s.SuppliesSubCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(s => s.Quantity)
                    .IsRequired()
                    .HasDefaultValue(0);

                entity.Property(s => s.TotalValue)
                    .HasColumnType("decimal(18,2)")
                    .IsRequired()
                    .HasDefaultValue(0);

                entity.Property(s => s.LastUpdated)
                    .IsRequired()
                    .HasDefaultValueSql("GETUTCDATE()");

                // Indexes
                entity.HasIndex(s => s.SuppliesSubCategoryId).IsUnique();
                entity.HasIndex(s => s.Quantity);
                entity.HasIndex(s => s.LastUpdated);
            });

            builder.Entity<StockTransaction>(entity =>
            {
                entity.HasKey(t => t.Id);
                
                entity.HasOne(t => t.Stock)
                    .WithMany(s => s.Transactions)
                    .HasForeignKey(t => t.StockId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(t => t.Supplies)
                    .WithMany()
                    .HasForeignKey(t => t.SuppliesId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(t => t.QuantityChange)
                    .IsRequired();

                entity.Property(t => t.ValueChange)
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();

                entity.Property(t => t.TransactionType)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(t => t.Reference)
                    .HasMaxLength(100);

                entity.Property(t => t.TransactionDate)
                    .IsRequired()
                    .HasDefaultValueSql("GETUTCDATE()");

                // Indexes
                entity.HasIndex(t => t.StockId);
                entity.HasIndex(t => t.TransactionType);
                entity.HasIndex(t => t.TransactionDate);
                entity.HasIndex(t => t.SuppliesId);
            });
        }

        private void ConfigureMembershipHistoryEntities(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MembershipHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UpdateDate).IsRequired();
                entity.Property(e => e.CardNumber).IsRequired().HasMaxLength(50);
                entity.HasOne(e => e.Member)
                    .WithMany()
                    .HasForeignKey(e => e.MemberId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.CardNumber);
            });
        }

        private void ConfigureSuggestedProgramEntities(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SuggestedProgram>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Project).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Committee).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Year).IsRequired();
                entity.HasIndex(e => e.Committee);
                entity.HasIndex(e => e.Year);
                entity.HasIndex(e => e.ImplementationStatus);
                entity.HasIndex(e => e.FundingStatus);
            });
        }

        private void ConfigureAidEntities(ModelBuilder builder)
        {
            builder.Entity<Aid>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.HasIndex(a => a.Reference).IsUnique();

                // Required fields
                entity.Property(a => a.Reference)
                    .IsRequired()
                    .HasMaxLength(50);
                entity.Property(a => a.Usage)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(a => a.DateOfAid)
                    .IsRequired();

                // Default values
                entity.Property(a => a.AidType)
                    .HasMaxLength(50)
                    .HasDefaultValue("نقدي");

                entity.Property(a => a.MonetaryValue)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                // ADD THIS: Relationship with OngoingProject
                entity.HasOne(a => a.OngoingProject)
                    .WithMany(op => op.Aids) // If you added ICollection<Aid> Aids to OngoingProject
                    .HasForeignKey(a => a.OngoingProjectId)
                    .IsRequired(false) // Make foreign key optional
                    .OnDelete(DeleteBehavior.SetNull); // Set null on delete

                // Relationships
                entity.HasMany(a => a.Items)
                    .WithOne(i => i.Aid)
                    .HasForeignKey(i => i.AidId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Indexes
                entity.HasIndex(a => a.Usage);
                entity.HasIndex(a => a.AidType);
                entity.HasIndex(a => a.DateOfAid);
                entity.HasIndex(a => a.OngoingProjectId); // ADD THIS index
            });

            builder.Entity<AidItem>(entity =>
            {
                entity.HasKey(ai => ai.Id);
                entity.Property(ai => ai.Quantity)
                    .IsRequired();

                entity.HasOne(ai => ai.Aid)
                    .WithMany(a => a.Items)
                    .HasForeignKey(ai => ai.AidId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(ai => ai.SuppliesSubCategory)
                    .WithMany()
                    .HasForeignKey(ai => ai.SuppliesSubCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }


        private void ConfigurePhaseEntities(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Phase>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.EndDate).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Budget).HasColumnType("decimal(18,2)");

                entity.HasOne(p => p.SuggestedProgram)
                    .WithMany(p => p.Phases)
                    .HasForeignKey(p => p.SuggestedProgramId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false);

                entity.HasOne(p => p.OngoingProject)
                    .WithMany(p => p.Phases)
                    .HasForeignKey(p => p.OngoingProjectId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false);

                entity.HasMany(p => p.Tasks)
                    .WithOne(t => t.Phase)
                    .HasForeignKey(t => t.PhaseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProjectTask>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasDefaultValue("pending");
            });
        }

        private void ConfigureDocumentTrackingEntities(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DocumentTracking>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(d => d.Session)
                    .WithMany()
                    .HasForeignKey(d => d.SessionId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(d => d.DocumentType)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(d => d.ActionType)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(d => d.ProofFilePath)
                    .IsRequired();

                entity.Property(d => d.ActionDate)
                    .HasDefaultValueSql("GETUTCDATE()");
            });
        }

        private void ConfigureSessionEntities(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Session>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SessionType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Location).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.SessionType);
                entity.HasIndex(e => e.SessionDate);
                entity.HasIndex(e => e.Status);
            });

            modelBuilder.Entity<SessionDocument>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.FilePath).IsRequired();
                entity.Property(e => e.UploadedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => new { e.SessionId, e.DocumentType }).IsUnique();
            });

            modelBuilder.Entity<SessionGuest>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Position).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Organization).HasMaxLength(200);
                entity.Property(e => e.Phone).IsRequired().HasMaxLength(20);
                entity.HasIndex(e => e.SessionId);
            });

            modelBuilder.Entity<SessionCandidate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Position).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CandidateFilePath).IsRequired();
                entity.HasIndex(e => e.SessionId);
            });
        }

        private void ConfigureMedicalEquipmentEntities(ModelBuilder builder)
        {
            builder.Entity<MedicalEquipment>(entity =>
            {
                entity.HasIndex(e => e.Reference).IsUnique();
                entity.Property(e => e.Status).HasDefaultValue("صالح");
                entity.Property(e => e.AcquisitionType).HasDefaultValue("مساعدات/هبات/تبرعات");

                entity.HasMany(e => e.Dispatches)
                    .WithOne(d => d.MedicalEquipment)
                    .HasForeignKey(d => d.MedicalEquipmentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<EquipmentDispatch>(entity =>
            {
                entity.Property(e => e.DispatchDate).HasDefaultValueSql("GETDATE()");
            });

            builder.Entity<EquipmentCategory>(entity =>
            {
                entity.HasIndex(e => e.Name).IsUnique();
            });

        }

        private void ConfigureDonsEntities(ModelBuilder builder)
        {
            builder.Entity<Dons>(entity =>
            {
                entity.HasIndex(d => d.Reference).IsUnique();

                entity.Property(d => d.Status).HasDefaultValue("صالح");
                entity.Property(d => d.DonsType).HasDefaultValue("نقدي");
                entity.Property(d => d.DonsScope).HasDefaultValue("عمومي");

                entity.Property(d => d.DateOfEntry)
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(d => d.MonetaryValue)
                    .HasColumnType("decimal(18,2)");

                // Add index for frequently filtered fields
                entity.HasIndex(d => d.Category);
                entity.HasIndex(d => d.Status);
                entity.HasIndex(d => d.DonsType);
                entity.HasIndex(d => d.DateOfEntry);
            });
        }

        private void ConfigureSuppliesEntities(ModelBuilder builder)
        {
            builder.Entity<Supplies>(entity =>
            {
                entity.HasKey(d => d.Id);
                entity.HasIndex(d => d.Reference).IsUnique();

                // Required fields
                entity.Property(d => d.Reference)
                    .IsRequired()
                    .HasMaxLength(50);
                entity.Property(d => d.Source)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(d => d.Usage)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(d => d.DateOfEntry)
                    .IsRequired();

                // Default values
                entity.Property(d => d.Status)
                    .HasMaxLength(50)
                    .HasDefaultValue("صالح");
                entity.Property(d => d.SuppliesType)
                    .HasMaxLength(50)
                    .HasDefaultValue("نقدي");
                entity.Property(d => d.SuppliesScope)
                    .HasMaxLength(50)
                    .HasDefaultValue("عمومي");
                entity.Property(d => d.SuppliesNature)
                    .HasMaxLength(50)
                    .HasDefaultValue("Donation");
                
                // Foreign key to OngoingProject
                entity.Property(d => d.OngoingProjectId)
                    .IsRequired(false); // Make it optional

                // Relationship with OngoingProject
                entity.HasOne(s => s.OngoingProject)
                    .WithMany(op => op.Supplies) // Add ICollection<Supplies> Supplies to OngoingProject
                    .HasForeignKey(s => s.OngoingProjectId)
                    .IsRequired(false) // Make foreign key optional
                    .OnDelete(DeleteBehavior.SetNull); // Set null on delete

                // Relationships
                entity.HasMany(d => d.Items)
                    .WithOne(i => i.Supplies)
                    .HasForeignKey(i => i.SuppliesId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Indexes
                entity.HasIndex(d => d.Source);
                entity.HasIndex(d => d.Usage);
                entity.HasIndex(d => d.Status);
                entity.HasIndex(d => d.SuppliesType);
                entity.HasIndex(d => d.SuppliesScope);
                entity.HasIndex(d => d.SuppliesNature);
                entity.HasIndex(d => d.DateOfEntry);
                entity.HasIndex(d => d.DateOfExit);
                entity.HasIndex(d => d.OngoingProjectId); // Add index for foreign key
            });
        }

        private void ConfigureSuppliesCategoryEntities(ModelBuilder builder)
        {
            builder.Entity<SuppliesCategory>(entity =>
            {
                entity.HasKey(dc => dc.Id);
                entity.Property(dc => dc.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasMany(dc => dc.SubCategories)
                    .WithOne(sc => sc.SuppliesCategory)
                    .HasForeignKey(sc => sc.SuppliesCategoryId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<SuppliesSubCategory>(entity =>
            {
                entity.HasKey(sc => sc.Id);
                entity.Property(sc => sc.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(sc => sc.UnitPrice)
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();

                entity.HasMany(sc => sc.SuppliesItems)
                    .WithOne(si => si.SuppliesSubCategory)
                    .HasForeignKey(si => si.SuppliesSubCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<SuppliesItem>(entity =>
            {
                entity.HasKey(di => di.Id);
                entity.Property(di => di.Quantity)
                    .IsRequired();

                entity.HasOne(di => di.Supplies)
                    .WithMany(d => d.Items)
                    .HasForeignKey(di => di.SuppliesId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }


        private void ConfigureActImmEntities(ModelBuilder builder)
        {
            builder.Entity<ActImm>(entity =>
            {
                entity.HasKey(a => a.Id);

                // Unique constraint for Number
                entity.HasIndex(a => a.Number).IsUnique();

                // Indexes for commonly filtered fields
                entity.HasIndex(a => a.Status);
                entity.HasIndex(a => a.SourceNature);
                entity.HasIndex(a => a.DateOfDeployment);
                entity.HasIndex(a => a.IsActive);

                // Configure relationship with ActImmCategory
                entity.HasOne(a => a.Category)
                    .WithMany() // if ActImmCategory has no navigation back to ActImms
                    .HasForeignKey(a => a.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .IsRequired();
            });

            builder.Entity<ActImmCategory>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(c => c.Name).IsUnique(); // Optional: make category names unique
            });



        }
        
        
        
        

    }
}