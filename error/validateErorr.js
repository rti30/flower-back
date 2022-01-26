class ValidateError {
   constructor() {
      //this.patternEmail = /[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}/igm;
      this.patternEmail = /([A-z0-9_.-]{1,})@([A-z0-9_.-]{1,}).([A-z]{2,8})/;
      //    this.patternPhone = /^((\+?7|8)[ \-] ?)?((\(\d{3}\))|(\d{3}))?([ \-])?(\d{3}[\- ]?\d{2}[\- ]?\d{2})$/;
      this.patternPhone = /(\+?7|8)([0-9]{3})([0-9]{3})([0-9]{2})([0-9]{2})/;
      this.patternPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
      this.patternLogin = /(S*\s){0,1}[a-zA-ZA-Яа-яЁё][a-zA-ZA-Яа-яЁё0-9]{0,19}/;
      this.patternName = /[a-zA-ZA-Яа-яЁё][a-zA-ZA-Яа-яЁё]/;
   }
   empty(param) {
      if (param === undefined || param === null || param.toString().trim() == '') { return true; }
      return false;
   }
   isInt(param) {
      return (+param ^ 0) === +param;
   }

   email(param) {
      return this.patternEmail.test(param);
   }
   phone(param) {
      return this.patternPhone.test(param);
   }
   password(param) {
      return this.patternPass.test(param);
   }
   login(param) {
      return this.patternLogin.test(param);
   }
   name(param) {
      return this.patternName.test(param);
   }


}
module.exports = new ValidateError();