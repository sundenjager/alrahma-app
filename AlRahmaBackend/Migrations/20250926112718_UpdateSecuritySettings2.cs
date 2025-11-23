using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlRahmaBackend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSecuritySettings2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "SuppliesSubCategories",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "SuppliesSubCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "SuppliesSubCategories",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "SuppliesSubCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "SuppliesItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "SuppliesItems",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "SuppliesItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "SuppliesItems",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "SuppliesCategories",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "SuppliesCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "SuppliesCategories",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "SuppliesCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Supplies",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Supplies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Supplies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Supplies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "SuggestedPrograms",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "SuggestedPrograms",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "StockTransactions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "StockTransactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "StockTransactions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "StockTransactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SuppliesSubCategoryId1",
                table: "Stocks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MembershipHistories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Members",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Members",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Members",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Members",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "MedicalEquipments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "MedicalEquipments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "MedicalEquipments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MedicalEquipments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "EquipmentDispatches",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "EquipmentDispatches",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "EquipmentDispatches",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "EquipmentDispatches",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "EquipmentCategories",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "EquipmentCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "EquipmentCategories",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionId1",
                table: "DocumentTrackings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_SuppliesSubCategoryId1",
                table: "Stocks",
                column: "SuppliesSubCategoryId1");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTrackings_SessionId1",
                table: "DocumentTrackings",
                column: "SessionId1");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTrackings_Sessions_SessionId1",
                table: "DocumentTrackings",
                column: "SessionId1",
                principalTable: "Sessions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Stocks_SuppliesSubCategories_SuppliesSubCategoryId1",
                table: "Stocks",
                column: "SuppliesSubCategoryId1",
                principalTable: "SuppliesSubCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTrackings_Sessions_SessionId1",
                table: "DocumentTrackings");

            migrationBuilder.DropForeignKey(
                name: "FK_Stocks_SuppliesSubCategories_SuppliesSubCategoryId1",
                table: "Stocks");

            migrationBuilder.DropIndex(
                name: "IX_Stocks_SuppliesSubCategoryId1",
                table: "Stocks");

            migrationBuilder.DropIndex(
                name: "IX_DocumentTrackings_SessionId1",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "SuppliesSubCategories");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "SuppliesSubCategories");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "SuppliesSubCategories");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "SuppliesSubCategories");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "SuppliesItems");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "SuppliesItems");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "SuppliesItems");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "SuppliesItems");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "SuppliesCategories");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "SuppliesCategories");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "SuppliesCategories");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "SuppliesCategories");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Supplies");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Supplies");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Supplies");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Supplies");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "SuggestedPrograms");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "SuggestedPrograms");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "StockTransactions");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "StockTransactions");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "StockTransactions");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "StockTransactions");

            migrationBuilder.DropColumn(
                name: "SuppliesSubCategoryId1",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MembershipHistories");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "MedicalEquipments");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "MedicalEquipments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "MedicalEquipments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MedicalEquipments");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "EquipmentDispatches");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "EquipmentDispatches");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "EquipmentDispatches");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "EquipmentDispatches");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "EquipmentCategories");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "EquipmentCategories");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "EquipmentCategories");

            migrationBuilder.DropColumn(
                name: "SessionId1",
                table: "DocumentTrackings");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "AspNetUsers");
        }
    }
}
