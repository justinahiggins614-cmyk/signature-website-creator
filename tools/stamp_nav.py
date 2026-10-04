#!/usr/bin/env python3
"""Stamp canonical tab bar + JAH network nav into site pages.
Placeholders: <!--TABS--> and <!--NAV--> in each HTML file.
Active tab is derived from the filename."""
import re, sys, pathlib

TABS = [
    ("index.html", "&#127968; Main"),
    ("builder.html", "&#128736;&#65039; Builder"),
    ("mirror.html", "&#12978; Mirror"),
    ("guide.html", "&#128214; Guide"),
    ("sites.html", "&#128449; My Websites"),
    ("options.html", "&#127912; 1M Options"),
]

SITES = [
    ("signature-math/", "1 Signature Math"),
    ("jah-calculator/", "2 Signature Universal Paradox Immune Calculator"),
    ("jah-dictionary/", "3 The Signature Dictionary"),
    ("jah-wiki/", "4 JAH Wiki"),
    ("jah-n-wiki-leaks/", "5 JAH-N Wiki"),
    ("signature-llama/", "6 Signature Llama"),
    ("jah-ai-models/", "7 The Signature AI Phone Book"),
    ("cyber-patent-catalog/", "8 Globally Rejustered Patent Catalog"),
    ("signature-one-archive/specs.html", "9 Signature Spec Catalog Pending Patents"),
    ("jah-computer-systems/", "10 The Signature PC System Depository"),
    ("signature-books/", "11 The Signature Book Depository"),
    ("signature-comics/", "12 The Signature Comic Store"),
    ("signature-newspapers/", "13 The Signature Global Newspaper Archive"),
    ("signature-backend/", "14 The Signature AI Mix and Match Generator"),
    ("signature-boundless-generators/", "15 The Signature Boundless Generator Archive"),
    ("signature-ai-mixlab/", "16 The Signature AI Mix Lab"),
    ("signature-ai-olypics/", "17 AI Olympics"),
    ("signature-chip-maker/", "18 The Signature Computer Chip Maker and Archive"),
    ("signature-app-archive/", "19 The Signature App Archive"),
    ("signature-ai-robot-matcher/", "20 The Signature AI Robot Matcher"),
    ("signature-experiment-solver/", "21 The Signature Experiment Solver"),
    ("signature-ai-image-video-maker/", "22 Signature AI Pixel"),
    ("signature-ai-song-maker/", "23 Signature Music Studio"),
    ("signature-fixit/", "24 The Signature Mr Fix-It"),
    ("signature-university/", "25 The Signature University"),
    ("signature-cyber-mega-mall/", "26 The Signature Cyber Mega-Mall"),
    ("signature-3d-print/", "27 The Signature 3D Print Mega Mall"),
    ("signature-earth/", "28 Signature Earth"),
    ("signature-flight-school/", "29 The Signature Flight School"),
    ("signature-game-store/", "30 The Signature Game Store"),
]
BASE = "https://justinahiggins614-cmyk.github.io/"
HERE = "31 The Signature Website Creator"

def tabbar(active):
    out = ['<nav class="jah-tabs" aria-label="Site pages">']
    for href, label in TABS:
        on = href == active
        cls = "tablink on" if on else "tablink"
        cur = ' aria-current="page"' if on else ""
        out.append(f'  <a class="{cls}" href="{href}"{cur}>{label}</a>')
    out.append("</nav>")
    return "\n".join(out)

def nav():
    out = ['<div class="jahnet"><span class="t">THE JAH NETWORK</span>']
    for path, label in SITES:
        out.append(f'<a href="{BASE}{path}">{label}</a>')
    out.append(f'<span class="here">{HERE} &mdash; YOU ARE HERE</span></div>')
    return "".join(out)

def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    for path in sys.argv[1:]:
        p = root / path
        s = p.read_text()
        active = pathlib.Path(path).name
        if "<!--TABS-->" in s:
            s = s.replace("<!--TABS-->", tabbar(active))
        if "<!--NAV-->" in s:
            s = s.replace("<!--NAV-->", nav())
        p.write_text(s)
        # verify
        s2 = p.read_text()
        links = re.findall(r'href="https://justinahiggins614-cmyk\.github\.io/[^"]+">(\d+) ', s2)
        assert len(links) == 30 and len(set(links)) == 30, f"nav link problem in {path}"
        assert s2.count("YOU ARE HERE") == 1, f"here-pill problem in {path}"
        tabs = re.findall(r'href="([a-z]+\.html)"', re.search(r'<nav class="jah-tabs".*?</nav>', s2, re.S).group(0))
        assert tabs == [t[0] for t in TABS], f"tab order problem in {path}: {tabs}"
        print(f"OK {path}: 30 nav links, tabs in order, active={active}")

if __name__ == "__main__":
    main()
