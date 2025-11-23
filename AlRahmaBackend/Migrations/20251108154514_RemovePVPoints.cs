using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlRahmaBackend.Migrations
{
    /// <inheritdoc />
    public partial class RemovePVPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PVPoints");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PVPoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommitteePVId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "pending"),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
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

            migrationBuilder.CreateIndex(
                name: "IX_PVPoints_CommitteePVId",
                table: "PVPoints",
                column: "CommitteePVId");
        }
    }
}
