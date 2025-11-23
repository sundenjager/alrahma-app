using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.DTOs
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "بريد إلكتروني غير صالح")]
        [StringLength(100, ErrorMessage = "يجب ألا يتجاوز البريد الإلكتروني 100 حرف")]
        public string Email { get; set; }

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [StringLength(100, MinimumLength = 8, 
            ErrorMessage = "يجب أن تكون كلمة المرور بين 8 و100 حرف")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$",
            ErrorMessage = "يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام ورموز")]
        public string Password { get; set; }

        [Required(ErrorMessage = "الاسم الأول مطلوب")]
        [StringLength(50, MinimumLength = 2, 
            ErrorMessage = "يجب أن يكون الاسم الأول بين 2 و50 حرف")]
        [RegularExpression(@"^[\p{L}\s'-]+$",
            ErrorMessage = "يجب أن يحتوي الاسم على أحرف عربية أو إنجليزية فقط")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "الاسم الأخير مطلوب")]
        [StringLength(50, MinimumLength = 2, 
            ErrorMessage = "يجب أن يكون الاسم الأخير بين 2 و50 حرف")]
        [RegularExpression(@"^[\p{L}\s'-]+$",
            ErrorMessage = "يجب أن يحتوي الاسم على أحرف عربية أو إنجليزية فقط")]
        public string LastName { get; set; }

        [Phone(ErrorMessage = "رقم هاتف غير صالح")]
        [StringLength(20, ErrorMessage = "يجب ألا يتجاوز رقم الهاتف 20 رقماً")]
        [RegularExpression(@"^[+0-9\s-]*$",
            ErrorMessage = "يجب أن يحتوي رقم الهاتف على أرقام فقط مع (+) للدول")]
        public string PhoneNumber { get; set; }
    }
}