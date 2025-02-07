console.log("Starting server...");
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-pdf", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });

        await page.evaluate(() => {
            return new Promise((resolve) => {
                if (window.MathJax) {
                    MathJax.typesetPromise().then(resolve);
                } else {
                    resolve();
                }
            });
        });

        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=exercise.pdf");
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "PDF generation failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
console.log(`Server should now be running on port ${PORT}`);

