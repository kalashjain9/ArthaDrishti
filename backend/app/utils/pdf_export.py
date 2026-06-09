"""
PDF research report generator using ReportLab.
"""
import asyncio
from io import BytesIO
from datetime import datetime, timezone
from typing import Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import mm, inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ArthaDrishti color palette
DEEP_NAVY = HexColor("#0A0D14")
CARD_SURFACE = HexColor("#111827")
AMBER = HexColor("#F59E0B")
RISK_RED = HexColor("#EF4444")
SIGNAL_GREEN = HexColor("#10B981")
SLATE = HexColor("#94A3B8")
TEXT_PRIMARY = HexColor("#F1F5F9")
BORDER = HexColor("#1E2D45")

DISCLAIMER_TEXT = (
    "This analysis is generated from publicly available documents and market data for informational "
    "purposes only. It does not constitute financial advice, investment recommendation, or trading signal. "
    "ArthaDrishti AI is not a SEBI-registered investment advisor. Past performance and AI-generated risk "
    "scores are not indicative of future results. Please consult a qualified financial advisor before "
    "making investment decisions."
)


async def generate_research_report(symbol: str, user_id: str) -> bytes:
    """Generate a comprehensive PDF research report for a symbol."""
    loop = asyncio.get_event_loop()

    # Gather data from agents
    from app.agents.risk_agent import RiskAgent
    from app.agents.news_agent import NewsAgent
    from app.agents.fraud_agent import FraudAgent
    from app.agents.competitor_agent import CompetitorAgent
    from app.utils.market_data import get_financials, get_quote

    fin_data, quote, risk_result, news_result, fraud_result, competitor_result = await asyncio.gather(
        get_financials(symbol),
        get_quote(symbol),
        RiskAgent().run(symbol=symbol, user_id=user_id),
        NewsAgent().run(symbol=symbol, user_id=user_id),
        FraudAgent().run(symbol=symbol, user_id=user_id),
        CompetitorAgent().run(symbol=symbol, user_id=user_id),
        return_exceptions=True,
    )

    def _build_pdf():
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20 * mm,
            leftMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )

        styles = getSampleStyleSheet()
        # Custom styles
        title_style = ParagraphStyle("Title", parent=styles["Title"],
                                     fontSize=24, textColor=AMBER, spaceAfter=6)
        h1_style = ParagraphStyle("H1", parent=styles["Heading1"],
                                  fontSize=16, textColor=AMBER, spaceAfter=4, spaceBefore=12)
        h2_style = ParagraphStyle("H2", parent=styles["Heading2"],
                                  fontSize=13, textColor=AMBER, spaceAfter=3, spaceBefore=8)
        body_style = ParagraphStyle("Body", parent=styles["Normal"],
                                    fontSize=10, textColor=HexColor("#1F2937"), leading=14)
        disclaimer_style = ParagraphStyle("Disclaimer", parent=styles["Normal"],
                                           fontSize=8, textColor=HexColor("#6B7280"), leading=10)
        metric_style = ParagraphStyle("Metric", parent=styles["Normal"],
                                      fontSize=11, textColor=HexColor("#1F2937"), leading=13)

        story = []

        # ── Cover ────────────────────────────────────────────────────────────
        story.append(Paragraph("◉ ArthaDrishti AI", ParagraphStyle(
            "Brand", parent=styles["Normal"], fontSize=12, textColor=AMBER,
        )))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"Equity Research Report: {symbol}", title_style))

        company_name = fin_data.get("name", symbol) if isinstance(fin_data, dict) else symbol
        story.append(Paragraph(company_name, ParagraphStyle(
            "CompanyName", parent=styles["Normal"], fontSize=14, textColor=HexColor("#374151"),
        )))

        generated_at = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
        story.append(Paragraph(f"Generated: {generated_at}", ParagraphStyle(
            "Date", parent=styles["Normal"], fontSize=9, textColor=HexColor("#6B7280"),
        )))
        story.append(HRFlowable(width="100%", color=AMBER, thickness=2, spaceAfter=12))

        # ── Key Metrics ──────────────────────────────────────────────────────
        story.append(Paragraph("Key Metrics", h1_style))
        if isinstance(quote, dict) and isinstance(fin_data, dict):
            metrics_data = [
                ["Current Price", f"₹{quote.get('price', 'N/A')}",
                 "Market Cap", f"₹{fin_data.get('market_cap', 0):,.0f}"],
                ["P/E Ratio", str(round(fin_data.get('pe_ratio', 0), 1)),
                 "Debt/Equity", str(round(fin_data.get('debt_equity', 0), 2))],
                ["ROE", f"{fin_data.get('roe', 0):.1%}" if isinstance(fin_data.get('roe', 0), float) else "N/A",
                 "Beta", str(round(fin_data.get('beta', 1), 2))],
            ]
            t = Table(metrics_data, colWidths=[45*mm, 45*mm, 45*mm, 45*mm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F9FAFB")),
                ("TEXTCOLOR", (0, 0), (-1, -1), HexColor("#111827")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [HexColor("#F9FAFB"), HexColor("#F3F4F6")]),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(t)
        story.append(Spacer(1, 8))

        # ── Risk Index ───────────────────────────────────────────────────────
        story.append(Paragraph("RashtriyaRiskIndex™", h1_style))
        if isinstance(risk_result, dict) and "risk_index" in risk_result:
            ri = risk_result["risk_index"]
            overall = ri.get("overall_score", 50)
            color = SIGNAL_GREEN if overall < 35 else (AMBER if overall < 65 else RISK_RED)
            story.append(Paragraph(
                f"Overall Risk Score: <b>{overall}/100</b>",
                ParagraphStyle("RiskScore", parent=styles["Normal"], fontSize=14,
                               textColor=color, spaceAfter=6),
            ))
            risk_dims = ["financial", "operational", "geopolitical", "legal",
                         "market", "esg", "fraud", "macro"]
            risk_table_data = [["Dimension", "Score", "Level", "Key Finding"]]
            for dim in risk_dims:
                d = ri.get(dim, {})
                score = d.get("score", 50)
                level = d.get("level", "medium")
                finding = d.get("key_finding", "")[:60]
                risk_table_data.append([dim.title(), str(score), level.title(), finding])

            rt = Table(risk_table_data, colWidths=[35*mm, 20*mm, 25*mm, 90*mm])
            rt.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), AMBER),
                ("TEXTCOLOR", (0, 0), (-1, 0), white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#F9FAFB"), HexColor("#F3F4F6")]),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
                ("PADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(rt)
        story.append(Spacer(1, 8))

        # ── News Sentiment ───────────────────────────────────────────────────
        story.append(Paragraph("News & Sentiment Analysis", h1_style))
        if isinstance(news_result, dict):
            agg = news_result.get("aggregate_sentiment", 0)
            trend = news_result.get("trend", "stable")
            story.append(Paragraph(
                f"Aggregate Sentiment: {agg:+.2f} | Trend: {trend.title()}",
                metric_style,
            ))
            for art in news_result.get("articles", [])[:5]:
                story.append(Paragraph(
                    f"• <b>{art.get('title', '')[:80]}</b> — {art.get('source', '')} "
                    f"({art.get('sentiment_label', 'neutral')})",
                    body_style,
                ))
        story.append(Spacer(1, 8))

        # ── Fraud Early Warning ──────────────────────────────────────────────
        story.append(Paragraph("Fraud Early Warning", h1_style))
        if isinstance(fraud_result, dict):
            fp = fraud_result.get("fraud_probability", "Unknown")
            m_score = fraud_result.get("m_score_estimate", "N/A")
            color = SIGNAL_GREEN if fp == "Low" else (AMBER if fp == "Medium" else RISK_RED)
            story.append(Paragraph(
                f"Fraud Probability: <b>{fp}</b> | Beneish M-Score: {m_score}",
                ParagraphStyle("FraudScore", parent=styles["Normal"], fontSize=12,
                               textColor=color, spaceAfter=4),
            ))
            for flag in fraud_result.get("red_flags", [])[:5]:
                story.append(Paragraph(
                    f"⚠ {flag.get('flag', '')} — {flag.get('severity', '').title()} Risk",
                    body_style,
                ))

        story.append(Spacer(1, 12))

        # ── Disclaimer ───────────────────────────────────────────────────────
        story.append(HRFlowable(width="100%", color=BORDER, thickness=1, spaceAfter=6))
        story.append(Paragraph("DISCLAIMER", ParagraphStyle(
            "DisclaimerTitle", parent=styles["Normal"], fontSize=9,
            textColor=HexColor("#6B7280"), fontName="Helvetica-Bold",
        )))
        story.append(Paragraph(DISCLAIMER_TEXT, disclaimer_style))

        doc.build(story)
        return buffer.getvalue()

    return await loop.run_in_executor(None, _build_pdf)
