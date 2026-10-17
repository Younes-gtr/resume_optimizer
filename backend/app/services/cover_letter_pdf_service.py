from datetime import date
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import Flowable, Paragraph, SimpleDocTemplate, Spacer

from app.schemas.cover_letter_schema import CoverLetter
from app.schemas.personal_info_schema import PersonalInfo

_BASE = ParagraphStyle("base", fontName="Helvetica", fontSize=11, leading=15)
_NAME = ParagraphStyle("name", parent=_BASE, fontName="Helvetica-Bold", fontSize=14, leading=18)
_BOLD = ParagraphStyle("bold", parent=_BASE, fontName="Helvetica-Bold")
_BODY = ParagraphStyle("body", parent=_BASE, alignment=TA_JUSTIFY, spaceAfter=10)


# The standard PDF fonts only cover Latin-1/Windows-1252: map common Unicode punctuation the LLM produces.
_PUNCTUATION = str.maketrans({"\u2010": "-", "\u2011": "-", "\u2012": "-", "\u00a0": " ", "\u202f": " ", "\u2009": " "})


def _clean(text: str) -> str:
    text = text.translate(_PUNCTUATION)
    return "".join(ch if ch.encode("cp1252", errors="ignore") else "?" for ch in text)


def _para(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(_clean(text)), style)


def format_date(day: date) -> str:
    return f"{day:%B} {day.day}, {day.year}"


def greeting(letter: CoverLetter) -> str:
    return f"Dear {letter.recipient}," if letter.recipient else "Dear Hiring Manager,"


def _lines(lines: list[str | None], style: ParagraphStyle) -> list[Flowable]:
    return [_para(line, style) for line in lines if line]


def render_cover_letter_pdf(letter: CoverLetter, info: PersonalInfo) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Cover letter - {info.full_name}",
        author=info.full_name,
    )

    story: list[Flowable] = [_para(info.full_name, _NAME)]
    story += _lines([info.location, info.email, info.phone, info.linkedin], _BASE)
    story += [Spacer(1, 0.8 * cm), Paragraph(format_date(date.today()), _BASE), Spacer(1, 0.6 * cm)]

    recipient_block = _lines([letter.recipient, letter.company, letter.company_location], _BASE)
    if recipient_block:
        story += recipient_block + [Spacer(1, 0.6 * cm)]

    if letter.job_title:
        story += [_para(f"Subject: Application for {letter.job_title}", _BOLD), Spacer(1, 0.5 * cm)]

    story += [_para(greeting(letter), _BASE), Spacer(1, 0.3 * cm)]
    story += [_para(p, _BODY) for p in letter.paragraphs if p.strip()]
    story += [Spacer(1, 0.3 * cm), Paragraph("Sincerely,", _BASE), Spacer(1, 0.8 * cm), _para(info.full_name, _BASE)]

    doc.build(story)
    return buffer.getvalue()
