const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

const {
  isPrivateAddress,
  signPayload,
  assertSafeUrl
} = require("../Infrastructure/webhookDelivery");

test("isPrivateAddress detects loopback, RFC1918 and IPv6 local ranges", () => {
  for (const address of ["127.0.0.1", "10.1.2.3", "192.168.1.10", "172.16.0.1", "172.31.255.255", "169.254.1.1", "::1", "fe80::1", "fd00::1"]) {
    assert.equal(isPrivateAddress(address), true, address);
  }
});

test("isPrivateAddress allows public addresses", () => {
  for (const address of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111"]) {
    assert.equal(isPrivateAddress(address), false, address);
  }
});

test("signPayload is a deterministic HMAC-SHA256 of timestamp and body", () => {
  const secret = "whsec_test_secret";
  const timestamp = "1700000000";
  const body = JSON.stringify({ hello: "world" });
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  assert.equal(signPayload(secret, timestamp, body), expected);
  assert.notEqual(signPayload(secret, "1700000001", body), expected);
});

test("assertSafeUrl rejects unsupported protocols and malformed URLs", async () => {
  await assert.rejects(() => assertSafeUrl("ftp://example.com/hook"), /http or https/);
  await assert.rejects(() => assertSafeUrl("not-a-url"), /Invalid webhook URL/);
});
