using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlRahmaBackend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRemovedDecisions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Decisions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Decisions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeliberationId = table.Column<int>(type: "int", nullable: false),
                    CancellationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Commentary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Committee = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DecisionNature = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DecisionTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DecisionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "pending"),
                    ExecutionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Members = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewBudget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    RelatedTo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RelatedType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_Decisions_DeliberationId",
                table: "Decisions",
                column: "DeliberationId");
        }
    }
}
