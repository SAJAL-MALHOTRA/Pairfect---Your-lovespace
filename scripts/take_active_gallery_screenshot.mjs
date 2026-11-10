import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const sessionData = {
  access_token: "eyJhbGciOiJFUzI1NiIsImtpZCI6IjQ2NzU3MWMyLTIzZTYtNDVhNi1hYjZiLTc1Mjk2MDg4NTRmMCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3ZoeWttaGZycHR5amthZ3dldGt1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYTM1YWI0OS0xMWE4LTQ1NmItYjIzNC04MDc3ZjhhZGYxNDkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkwODkzOTAwLCJpYXQiOjE3OTA4OTAzMDAsImVtYWlsIjoibWFsaG90cmF4c2FqYWxAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLTTVSNnFsaUFCLVhzVFRhRHNrUlg5X3NnMGtfMlZDYXU1Q0tyRUpVbGVFalFLdVE9czk2LWMiLCJlbWFpbCI6Im1hbGhvdHJheHNhamFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJTQUpBTCBNQUxIT1RSQSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJTQUpBTCBNQUxIT1RSQSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tNNVI2cWxpQUItWHNUVGFEc2tSWDlfc2cwa18yVkNhdTVDS3JFSlVsZUVqUUt1UT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTAwMzA1NjU0MTcwNTI0NTU3ODUzIiwic3ViIjoiMTAwMzA1NjU0MTcwNTI0NTU3ODUzIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib3RwIiwidGltZXN0YW1wIjoxNzkwODkwMzAwfV0sInNlc3Npb25faWQiOiJhZTA3ODMzYS0zZmQ0LTQ0MmEtYTBlNS0yMTM0YjVlYzRiNjUiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.ToFDFGjT163i1xlgjPZjrhstOnyh1CZVrQZ1FgxIbH3G1lOV_bGc8Ap2pbSu37bceQ5dkyTs5NALHOAgUZGTbA",
  refresh_token: "ywrus3dtswt6",
  expires_at: 1790893900,
  user: {
    id: "ca35ab49-11a8-456b-b234-8077f8adf149",
    email: "malhotraxsajal@gmail.com",
    user_metadata: {
      name: "SAJAL MALHOTRA",
      avatar_url: "https://lh3.googleusercontent.com/a/ACg8ocKM5R6qliAB-XsTTaDskRX9_sg0k_2VCau5CKrEJUleEjQKuQ=s96-c",
    },
  },
};

async function main() {
  const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";

  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  const executablePath = possiblePaths.find((p) => p && fs.existsSync(p));

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  // Inject cookies and localStorage
  const cookieVal = encodeURIComponent(JSON.stringify(sessionData));
  await context.addCookies([
    {
      name: "sb-vhykmhfrptyjkagwetku-auth-token",
      value: cookieVal,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  await page.addInitScript((session) => {
    window.localStorage.setItem(
      "sb-vhykmhfrptyjkagwetku-auth-token",
      JSON.stringify(session)
    );
  }, sessionData);

  console.log("Navigating to http://localhost:3000/bouquet...");
  await page.goto("http://localhost:3000/bouquet", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // Click Received Bouquets tab
  console.log("Clicking Received Bouquets tab...");
  const receivedTab = await page.getByRole("button", { name: /Received Bouquets/i });
  if (receivedTab) {
    await receivedTab.click();
    await page.waitForTimeout(2000);

    console.log("Taking populated gallery screenshot...");
    await page.screenshot({
      path: path.join(artifactDir, "bouquet-received-gallery-active.png"),
      fullPage: false,
    });
  }

  await browser.close();
  console.log("Active gallery screenshot saved!");
}

main().catch(console.error);
