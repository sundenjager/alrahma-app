using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlRahmaBackend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMedEquipRefOpt2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MedicalEquipments_Reference",
                table: "MedicalEquipments");

            migrationBuilder.AlterColumn<string>(
                name: "Reference",
                table: "MedicalEquipments",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalEquipments_Reference",
                table: "MedicalEquipments",
                column: "Reference",
                unique: true,
                filter: "[Reference] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MedicalEquipments_Reference",
                table: "MedicalEquipments");

            migrationBuilder.AlterColumn<string>(
                name: "Reference",
                table: "MedicalEquipments",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedicalEquipments_Reference",
                table: "MedicalEquipments",
                column: "Reference",
                unique: true);
        }
    }
}
