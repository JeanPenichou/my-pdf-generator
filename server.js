const { execSync } = require("child_process");

// ✅ Manually download and install Google Chrome
console.log("🔄 Installing Google Chrome...");
try {
    execSync(
        `apt update && apt install -y wget curl unzip fontconfig locales gconf-service libasound2 libatk1.0-0 libcups2 libdbus-1-3 libgtk-3-0 libnspr4 libxcomposite1 libxrender1 libxss1 libxtst6 libnss3 &&
        wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb &&
        apt install -y /tmp/chrome.deb`,
        { stdio: "inherit" }
    );
    console.log("✅ Google Chrome installed successfully!");
} catch (error) {
    console.error("❌ Failed to install Google Chrome:", error);
}


console.log("Starting server...");
const express = require("express");
const puppeteer = require("puppeteer-core");
const cors = require("cors");

console.log("✅ Modules loaded successfully...");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-pdf", async (req, res) => {
    try {
        console.log("Received request to generate PDF...");
        const { url, html } = req.body;
        if (!url && !html) return res.status(400).json({ error: "Either 'url' or 'html' is required" });

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: "/usr/bin/google-chrome", 
            args: [
                "--no-sandbox",
        	"--disable-setuid-sandbox",
        	"--disable-dev-shm-usage",
        	"--disable-accelerated-2d-canvas",
        	"--disable-gpu",
        	"--no-zygote",
        	"--single-process",
        	"--disable-background-networking",
        	"--disable-software-rasterizer",
        	"--mute-audio"
            ]
        });

	console.log("📝 Creating new page...");
        const page = await browser.newPage();
	
	if (url) {
	    console.log("🔗 Navigating to:", url);
            await page.goto(url, { waitUntil: "networkidle2" });
	} else if (html) {
            console.log("📄 Rendering HTML content...");
            await page.setContent(html, { waitUntil: "networkidle2" });
	}

        console.log("Processing MathJax...");
	    await page.evaluate(async () => {
    		if (window.MathJax) {
        	    console.log("🔄 MathJax detected. Processing equations...");
        	    await MathJax.typesetPromise();
        	    console.log("✅ MathJax processing complete!");
    	        } else {
                    console.log("⚠️ MathJax not found on page.");
    		}
	    }); 

	    // Ensure Puppeteer waits long enough for MathJax to render
	    await page.waitForTimeout(2000); // ✅ Wait 2 seconds for MathJax to finalize


        console.log("Generating PDF...");
        console.log("📄 Generating PDF with top margin...");
	const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "50px" } });

	console.log("🔒 Closing browser...");
        await browser.close();

        console.log("PDF generated, sending response...");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=exercise.pdf");
	res.setHeader("Content-Type", "application/json");
	res.json({ success: true, message: "PDF généré avec succès" });

        res.send(pdfBuffer);
    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({ error: "PDF generation failed" });
    }
});

// ✅ Define PORT properly
const PORT = process.env.PORT || 8080;

// ✅ Start the server correctly
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// ✅ Handle errors properly
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error("Port already in use. Trying another port...");
        server.listen(0);
    } else {
        console.error("Server error:", err);
    }
});
