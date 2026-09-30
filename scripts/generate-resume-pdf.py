"""Generate resume PDFs (EN and PT) from index.html using its @media print styles.

Usage: python scripts/generate-resume-pdf.py
Requires: pip install playwright && playwright install chromium
"""

from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "files"
LANGUAGES = ("en", "pt")


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    page_url = (ROOT / "index.html").as_uri()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for lang in LANGUAGES:
            context = browser.new_context()
            context.add_init_script(
                f"localStorage.setItem('resume-lang', '{lang}');"
                "localStorage.setItem('resume-theme', 'light');"
            )
            page = context.new_page()
            page.goto(page_url, wait_until="networkidle")
            page.wait_for_selector("#experience-list .entry")
            page.evaluate("document.fonts.ready")

            target = OUTPUT_DIR / f"Igor-Santana-Resume-{lang}.pdf"
            page.pdf(
                path=str(target),
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
            )
            print(f"Wrote {target.relative_to(ROOT)}")
            context.close()
        browser.close()


if __name__ == "__main__":
    main()
