class ApiErrors extends Error {
   constructor(status, messege) {
      super();
      this.status = status;
      this.messege = messege;
   }

   static badRequest(messege) {
      return new ApiErrors(400, messege)
   }
   static forbiden(messege) {
      return new ApiErrors(403, messege)
   }
   static internal(messege) {
      return new ApiErrors(500, messege)
   }
   static unauthorizeError(messege) {
      return new ApiErrors(401, messege)
   }
}
module.exports = ApiErrors