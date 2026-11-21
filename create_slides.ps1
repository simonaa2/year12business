$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
$pres = $ppt.Presentations.Add()

# Helper function to add slides
function Add-Slide($title, $bullets, $notesText) {
    # 2 = ppLayoutText (standard title and text layout)
    $slide = $pres.Slides.Add($pres.Slides.Count + 1, 2)
    $slide.Shapes.Item(1).TextFrame.TextRange.Text = $title
    
    # Format bullets
    $bulletRange = $slide.Shapes.Item(2).TextFrame.TextRange
    $bulletRange.Text = ($bullets -join "`n")
    
    # Add Speaker Notes
    $slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = $notesText
}

# Slide 1: Title
$slide1 = $pres.Slides.Add(1, 1) # ppLayoutTitle
$slide1.Shapes.Item(1).TextFrame.TextRange.Text = "HSC Business Studies"
$slide1.Shapes.Item(2).TextFrame.TextRange.Text = "Trial Prep Masterclass: Gearing, Disputes & V4s\nPresented by Mr. Anderson"
$slide1.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = "Welcome class. Today we will focus on high-yield HSC questions to prepare for your trial exams."

# Slide 2: Finance
Add-Slide "Finance Priority: Gearing & Solvency" @(
    "• Derived from HSC 2022 Q24 & HSC 2018 Q23",
    "• Gearing Ratio (Debt-to-Equity): TL / OE = 2:1 (200% Gearing)",
    "• High Gearing = High Solvency Risk & vulnerability to interest rate spikes",
    "• Working Capital Survival Strategies:",
    "   - Accounts Receivable Factoring (immediate cash inflow)",
    "   - Equipment Leasing (replaces capital outflows with periodic rent)",
    "   - Sale and Leaseback (unlocks cash from fixed assets)"
) "Ratios are Section II gold. Focus on Gearing. Make sure you can explain that high gearing raises interest rate default risks, while JIT inventory and factoring resolve short-term liquidity bottlenecks."

# Slide 3: HR
Add-Slide "HR Priority: Disputes & Effectiveness" @(
    "• Derived from HSC 2017 Q22 & HSC 2022 Q21",
    "• Dispute Progression: Grievance Procedures ➔ Mediation ➔ Arbitration",
    "• Mediation vs. Arbitration Contrast:",
    "   - Mediation: Facilitated discussion, voluntary, non-binding outcome",
    "   - Arbitration: Formal FWC hearing, evidence-based, legally binding award",
    "• Quantitative HR Effectiveness Indicators:",
    "   - High staff turnover: signals poor culture and raises recruitment costs",
    "   - High absenteeism: reflects low employee morale and stress"
) "Workplace disputes are heavily examined. Ensure students remember that mediation is non-binding and collaborative, while arbitration results in a legally binding award."

# Slide 4: Operations
Add-Slide "Operations Priority: V4s & Strategies" @(
    "• Derived from HSC 2021 Q21 & HSC 2020 Q23",
    "• Variation in Demand (V4): Fluctuating customer volume (e.g. Maccas lunch rush)",
    "• Managing Variation: Predictive sequencing software & flexible staffing",
    "• Operations strategies to resolve quality/cost issues:",
    "   - Established & Leading-Edge Technology: Automated sensors check quality in real-time",
    "   - JIT Inventory Control: Lowers holding costs & reduces warehousing waste"
) "Variation is about adjusting capacity. Apply this to McDonald's peak hours. For the strategies, show how automation and JIT directly resolve defect rates and holding costs."

# Slide 5: Essay Writing
Add-Slide "HSC Writing Focus: The PEEL Model" @(
    "• P - Point: Clear topic sentence using syllabus terms",
    "• E - Explain: Cause-and-effect theoretical explanation",
    "• E - Evidence: Direct case study application (McDonald's)",
    "• L - Link: Connect back to business goals (profitability, cost control)",
    "• Activity: Write one PEEL paragraph on Operations technology"
) "Conclude by having students write one paragraph using the PEEL structure. Check their work for Case Study evidence and linkage back to cost leadership or profitability."

$pres.SaveAs("C:\Users\simon.anderson\.gemini\antigravity\scratch\year12business\HSC_Trial_Revision_Masterclass.pptx")
$pres.Close()
$ppt.Quit()
