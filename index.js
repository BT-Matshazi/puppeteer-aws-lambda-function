import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";

async function getPdf(url) {
  try {
    puppeteerExtra.use(StealthPlugin());

    const browser = await puppeteerExtra.launch({
      headless: true,
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      scale: 0.9,
      margin: {
        top: "40px",
        bottom: "40px",
      },
    });

    await browser.close();

    return pdfBuffer;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);
    const { url } = body;

    const pdfBuffer = await getPdf(url);

    if (!pdfBuffer) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to generate PDF" }),
      };
    }

    // Convert PDF buffer to base64
    const pdfBase64 = pdfBuffer.toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({ pdfBase64, pdfBuffer }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
}
