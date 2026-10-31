const test = require("node:test");
const assert = require("node:assert/strict");

const { generateOtp } = require("../Utils/otp");

test("generateOtp returns a 6-digit code", () => {
  for (let i = 0; i < 200; i += 1) {
    const otp = generateOtp();
    assert.match(otp, /^\d{6}$/);
    assert.ok(Number(otp) >= 100000 && Number(otp) < 1000000);
  }
});
