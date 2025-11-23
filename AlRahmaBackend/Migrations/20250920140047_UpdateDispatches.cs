using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlRahmaBackend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDispatches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PDFFilePath",
                table: "EquipmentDispatches",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PDFFilePath",
                table: "EquipmentDispatches");
        }
    }
}
