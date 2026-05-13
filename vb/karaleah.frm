VERSION 5.00
Begin VB.Form Karaleah 
   Appearance      =   0  'Flat
   BackColor       =   &H80000005&
   BorderStyle     =   1  'Fixed Single
   Caption         =   "Radio Cartographer"
   ClientHeight    =   315
   ClientLeft      =   30
   ClientTop       =   315
   ClientWidth     =   9540
   ControlBox      =   0   'False
   BeginProperty Font 
      Name            =   "MS Sans Serif"
      Size            =   8.25
      Charset         =   0
      Weight          =   700
      Underline       =   0   'False
      Italic          =   0   'False
      Strikethrough   =   0   'False
   EndProperty
   ForeColor       =   &H80000008&
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   PaletteMode     =   1  'UseZOrder
   ScaleHeight     =   315
   ScaleWidth      =   9540
   Begin VB.Label Label1 
      Caption         =   "N"
      Height          =   135
      Left            =   3000
      TabIndex        =   0
      Top             =   120
      Visible         =   0   'False
      Width           =   135
   End
   Begin VB.Menu FileMenu 
      Caption         =   "&File"
      Begin VB.Menu AboutFileMenu 
         Caption         =   "&About ""Karaleah""..."
      End
      Begin VB.Menu Dummy1FileMenu 
         Caption         =   "-"
      End
      Begin VB.Menu ExitFileMenu 
         Caption         =   "E&xit"
      End
   End
   Begin VB.Menu ImageMenu 
      Caption         =   "&Image"
      Begin VB.Menu OpenImageMenu 
         Caption         =   "&Open Image..."
      End
      Begin VB.Menu SaveImageMenu 
         Caption         =   "&Save Image"
         Enabled         =   0   'False
      End
      Begin VB.Menu SaveAsImageMenu 
         Caption         =   "Save Image &As..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dumb 
         Caption         =   "-"
      End
      Begin VB.Menu SaveAsBitmapMenu 
         Caption         =   "Sa&ve Bitmap As..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy2ImageMenu 
         Caption         =   "-"
      End
      Begin VB.Menu PrintImageMenu 
         Caption         =   "&Print Image"
         Enabled         =   0   'False
      End
      Begin VB.Menu Summy3SurveyMenu 
         Caption         =   "-"
      End
      Begin VB.Menu AppendImageMenu 
         Caption         =   "Appen&d Image..."
         Enabled         =   0   'False
      End
      Begin VB.Menu SuperImageMenu 
         Caption         =   "Supe&rimpose Image..."
         Enabled         =   0   'False
      End
      Begin VB.Menu DumbImageMenu 
         Caption         =   "-"
      End
      Begin VB.Menu BiColorImageMenu 
         Caption         =   "Make &Bi-Color Image..."
         Enabled         =   0   'False
      End
      Begin VB.Menu TriColorImageMenu 
         Caption         =   "Make &Tri-Color Image..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy3ImageMenu 
         Caption         =   "-"
      End
      Begin VB.Menu WindowImageMenu 
         Caption         =   "Show Pa&lette..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy4ImageMenu 
         Caption         =   "-"
      End
      Begin VB.Menu ScaleImageMenu 
         Caption         =   "Change &Magnifier Size..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy5ImageMenu 
         Caption         =   "-"
      End
      Begin VB.Menu NameImageMenu 
         Caption         =   "Change Image &Name..."
         Enabled         =   0   'False
      End
   End
   Begin VB.Menu SurveyMenu 
      Caption         =   "Sur&vey"
      Begin VB.Menu NewSurveyMenu 
         Caption         =   "&New Survey..."
      End
      Begin VB.Menu OpenSurveyMenu 
         Caption         =   "&Open Survey..."
      End
      Begin VB.Menu SaveSurveyMenu 
         Caption         =   "&Save Survey"
         Enabled         =   0   'False
      End
      Begin VB.Menu SaveAsSurveyMenu 
         Caption         =   "Save Survey &As..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy1SurveyMenu 
         Caption         =   "-"
      End
      Begin VB.Menu SweepSurveyMenu 
         Caption         =   "&Goto Sweep..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy2SurveyMenu 
         Caption         =   "-"
      End
      Begin VB.Menu NameSurveyMenu 
         Caption         =   "&Change Survey Name..."
         Enabled         =   0   'False
      End
   End
   Begin VB.Menu ScanMenu 
      Caption         =   "&Scan"
      Begin VB.Menu NewScanMenu 
         Caption         =   "&New Scan..."
      End
      Begin VB.Menu OpenScanMenu 
         Caption         =   "&Open Scan..."
      End
      Begin VB.Menu SaveScanMenu 
         Caption         =   "&Save Scan"
         Enabled         =   0   'False
      End
      Begin VB.Menu SaveAsScanMenu 
         Caption         =   "Save Scan &As..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy1ScanMenu 
         Caption         =   "-"
      End
      Begin VB.Menu PrintScanMenu 
         Caption         =   "&Print Scan"
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy2ScanMenu 
         Caption         =   "-"
      End
      Begin VB.Menu AppendScanMenu 
         Caption         =   "Appen&d Scan..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy3ScanMenu 
         Caption         =   "-"
      End
      Begin VB.Menu NameScanMenu 
         Caption         =   "&Change Scan Name..."
         Enabled         =   0   'False
      End
   End
   Begin VB.Menu CalMenu 
      Caption         =   "&Calibration"
      Begin VB.Menu SelectCalMenu 
         Caption         =   "Se&lect Calibration..."
      End
      Begin VB.Menu Dummy1CalMenu 
         Caption         =   "-"
      End
      Begin VB.Menu NewCalMenu 
         Caption         =   "&New Calibration..."
      End
      Begin VB.Menu OpenCalMenu 
         Caption         =   "&Open Calibration..."
      End
      Begin VB.Menu SaveCalMenu 
         Caption         =   "&Save Calibration"
         Enabled         =   0   'False
      End
      Begin VB.Menu SaveAsCalMenu 
         Caption         =   "Save Calibration &As..."
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy2CalMenu 
         Caption         =   "-"
      End
      Begin VB.Menu PrintCalMenu 
         Caption         =   "&Print Calibration"
         Enabled         =   0   'False
      End
      Begin VB.Menu Dummy3CalMenu 
         Caption         =   "-"
      End
      Begin VB.Menu NameCalMenu 
         Caption         =   "&Change Calibration Name..."
         Enabled         =   0   'False
      End
   End
End
Attribute VB_Name = "Karaleah"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim Length%
Dim Nm$
Dim Junk$
Dim Opt%
Dim Button%
Dim Color%
Dim Temp%

Private Sub AboutFileMenu_Click()
  Load DanForm
  DanForm.Show 1
End Sub

Private Sub AppendImageMenu_Click()
  Load LoadData
  LoadData.Caption = "Append Image"
  LoadData.Label2.Caption = "*.img"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.img"
  LoadData.Show 1
  SurvForm.Refresh
  If LoadData.Caption = "append" Then
    SurvForm.Picture4.SetFocus
  Else
    Unload LoadData
  End If
End Sub

Private Sub AppendScanMenu_Click()
  Load LoadData
  LoadData.Caption = "Append Scan"
  LoadData.Label2.Caption = "*.scn"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.scn"
  LoadData.Show 1
  ScanForm.Refresh
  If LoadData.Caption = "show" Then
    ScanForm.Picture2.SetFocus
  Else
    Unload LoadData
  End If
End Sub

Private Sub BiColorImageMenu_Click()
  Load LoadData
  LoadData.Caption = "Select Second Image"
  LoadData.Label2.Caption = "*.img"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.img"
  LoadData.Show 1
  SurvForm.Refresh
  If LoadData.Caption = "bicolor" Then
    SurvForm.Picture4.SetFocus
  Else
    Unload LoadData
  End If
End Sub

Private Sub ExitFileMenu_Click()
  Button% = 1
  LoadData.Caption = "New Scan"
  If (SurvForm.Visible = -1) Or (ScanForm.Visible = -1) Or (CalForm.Visible = -1) Then
    Opt% = 1 Or 48
    Button% = MsgBox("Open File(s) Will Be Discarded", Opt%, "Status Message")
  End If
  If Button% = 1 Then
    Unload LoadData
    Unload DataForm
    Unload CalForm
    Unload ScanForm
    Unload SurvForm
    Karaleah.Hide
    Unload Backdrop
    Unload Karaleah
  End If
End Sub

Private Sub Form_Load()
  Backdrop.Show
  Load DataForm
End Sub

Private Sub NameCalMenu_Click()
  Nm$ = InputBox$("Calibration Name:", "Change Calibration Name", CalForm.Caption)
  If Nm$ <> "" Then
    CalForm.Caption = Nm$
    CalForm.Refresh
  End If
End Sub

Private Sub NameImageMenu_Click()
  Nm$ = InputBox$("Image Name:", "Change Image Name", SurvForm.Label4.Caption)
  If Nm$ <> "" Then
    Length% = Len(SurvForm.Caption)
    SurvForm.Caption = Nm$ + Right$(SurvForm.Caption, Length% - Len(SurvForm.Label4.Caption))
    SurvForm.Label4.Caption = Nm$
  End If
  SurvForm.Refresh
End Sub

Private Sub NameScanMenu_Click()
  Nm$ = InputBox$("Scan Name:", "Change Scan Name", ScanForm.Caption)
  If Nm$ <> "" Then
    ScanForm.Caption = Nm$
  End If
  ScanForm.Refresh
End Sub

Private Sub NameSurveyMenu_Click()
  Nm$ = InputBox$("Survey Name:", "Change Survey Name", SurvForm.Label2.Caption)
  If Nm$ <> "" Then
    Length% = Len(SurvForm.Caption)
    SurvForm.Caption = Nm$ + Right$(SurvForm.Caption, Length% - Len(SurvForm.Label2.Caption))
    SurvForm.Label2.Caption = Nm$
  End If
  SurvForm.Refresh
End Sub

Private Sub NewCalMenu_Click()
  If CalForm.Visible = -1 Then
    Opt% = 1 Or 48
    Button% = MsgBox("Open Calibration Will Be Discarded", Opt%, "Status Message")
    If Button% = 1 Then
      Unload CalForm
    End If
  Else
    Unload CalForm
  End If
  Load CalForm
  CalForm.Caption = "Telescope Calibration"
  CalForm.Show
End Sub

Private Sub NewScanMenu_Click()
  Load LoadData
  LoadData.Caption = "New Scan"
  LoadData.Label2.Caption = "*.md1"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.md1"
  LoadData.Show 1
  If LoadData.Caption = "show" Then
    Load ScanForm
    Length% = Len(LoadData.File1.filename)
    ScanForm.Caption = UCase$(Left$(LoadData.File1.filename, Length% - 4))
    ScanForm.Label2.Caption = ""
    Unload LoadData
    ScanForm.Show
  Else
    Unload LoadData
  End If
End Sub

Private Sub NewSurveyMenu_Click()
  Load LoadData
  LoadData.Caption = "New Survey"
  LoadData.Label2.Caption = "*.md2"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.md2"
  LoadData.Show 1
  If LoadData.Caption = "show" Then
    Load SurvForm
    Length% = Len(LoadData.File1.filename)
    SurvForm.Label2.Caption = UCase$(Left$(LoadData.File1.filename, Length% - 4))
    SurvForm.Caption = SurvForm.Label2.Caption + " - Sweep 1"
    Unload LoadData
    SurvForm.Show
  Else
    Unload LoadData
  End If
End Sub

Private Sub OpenCalMenu_Click()
  Load LoadData
  LoadData.Caption = "Open Calibration"
  LoadData.Label2.Caption = "*.cal"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.cal"
  LoadData.Show 1
  If LoadData.Caption = "show" Then
    Load CalForm
    CalForm.Label3.Caption = LoadData.Label4.Caption + "\" + LoadData.File1.filename
    Unload LoadData
    CalForm.Show
  Else
    Unload LoadData
  End If
End Sub

Private Sub OpenImageMenu_Click()
  Load LoadData
  LoadData.Caption = "Open Image"
  LoadData.Label2.Caption = "*.img"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.img"
  LoadData.Show 1
  If LoadData.Caption = "show" Then
    Load SurvForm
    SurvForm.Label5.Caption = LoadData.Label4.Caption + "\" + LoadData.File1.filename
    Unload LoadData
    SurvForm.Show
  Else
    Unload LoadData
  End If
End Sub

Private Sub OpenScanMenu_Click()
  Load LoadData
  LoadData.Caption = "Open Scan"
  LoadData.Label2.Caption = "*.scn"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.scn"
  LoadData.Show 1
  If LoadData.Caption = "show" Then
    Load ScanForm
    ScanForm.Label2.Caption = LoadData.Label4.Caption + "\" + LoadData.File1.filename
    Unload LoadData
    ScanForm.Show
  Else
    Unload LoadData
  End If
End Sub

Private Sub OpenSurveyMenu_Click()
  Load LoadData
  LoadData.Caption = "Open Survey"
  LoadData.Label2.Caption = "*.srv"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.srv"
  LoadData.Show 1
  If LoadData.Caption = "show" Then
    Load SurvForm
    SurvForm.Label3.Caption = LoadData.Label4.Caption + "\" + LoadData.File1.filename
    Unload LoadData
    SurvForm.Show
  Else
    Unload LoadData
  End If
End Sub

Private Sub PreImageSurveyMenu_Click()
End Sub

Private Sub PrintCalMenu_Click()
  On Error GoTo PPrintError
  CalForm.PrintForm
XXsub:
  Exit Sub
PPrintError:
  MsgBox Error$, 48, "Error Message"
  Resume XXsub
End Sub

Private Sub PrintImageMenu_Click()
  Junk$ = SurvForm.Label8.Caption
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  While Left$(Junk$, 1) <> " "
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  While Left$(Junk$, 1) <> " "
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  While Left$(Junk$, 1) <> " "
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  While Left$(Junk$, 1) <> " "
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  Length% = Len(Junk$)
  Junk$ = Right$(Junk$, Length% - 2)
  While Left$(Junk$, 1) <> " "
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  Length% = Len(Junk$)
  Junk$ = Right$(Junk$, Length% - 2)
  For Num% = 1 To 4
    Tempp$ = ""
    While Left$(Junk$, 1) <> " "
      Tempp$ = Tempp$ + Left$(Junk$, 1)
      Length% = Len(Junk$)
      Junk$ = Right$(Junk$, Length% - 1)
    Wend
    If Num% = 2 Then
      Red% = Val(Tempp$)
    ElseIf Num% = 3 Then
      Green% = Val(Tempp$)
    ElseIf Num% = 4 Then
      Blue% = Val(Tempp$)
    End If
    Length% = Len(Junk$)
    If Num% <> 4 Then
      Junk$ = Right$(Junk$, Length% - 2)
    End If
  Next
  Button% = 7
  If (Red% <> 255) Or (Green% <> 255) Or (Blue% <> 255) Then
    Opt% = 4 Or 32
    Button% = MsgBox("Poor Printer Palette.  Cancel?", Opt%, "Status Message")
  End If
  If Button% = 7 Then
    On Error GoTo PPPrintError
    SurvForm.PrintForm
  End If
XXXsub:
  Exit Sub
PPPrintError:
  MsgBox Error$, 48, "Error Message"
  Resume XXXsub
End Sub

Private Sub PrintMenu_Click()
End Sub

Private Sub PrintScanMenu_Click()
  On Error GoTo PrintError
  ScanForm.PrintForm
Xsub:
  Exit Sub
PrintError:
  MsgBox Error$, 48, "Error Message"
  Resume Xsub
End Sub

Private Sub RenewSurveyMenu_Click()
End Sub

Private Sub SaveAsBitmapMenu_Click()
  If Label1.Caption = "Y" Then
    MsgBox "Turn Magnifier Off", 48, "Save Bitmap As"
  Else
  
  Load LoadData
  LoadData.Caption = "Save Bitmap As"
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.File1.Enabled = 0
  If SurvForm.Label5.Caption = "" Then
    Length% = Len(SurvForm.Label4.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label4.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(SurvForm.Label4.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".bmp"
  Else
    Length% = Len(SurvForm.Label5.Caption)
    Temp% = 0
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label5.Caption), Num%, 1) = "\" Then
        Temp% = Num%
      End If
    Next
    LoadData.Text1.Text = Mid$(LTrim$(SurvForm.Label5.Caption), Temp% + 1, Length% - Temp% - 3) + "bmp"
  End If
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.*"
  LoadData.Show 1
  SurvForm.Refresh
  'SurvForm.Picture4.SetFocus
  SavePicture SurvForm.Picture4.Image, LoadData.Text1.Text
  If LoadData.Caption = "save" Then
    SurvForm.Label5.Caption = LoadData.Label4.Caption + "\" + LoadData.Text1.Text
  End If
  If LoadData.Caption <> "show" Then
    Unload LoadData
  End If

  End If
End Sub

Private Sub SaveAsCalMenu_Click()
  Load LoadData
  LoadData.Caption = "Save Calibration As"
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.File1.Enabled = 0
  If CalForm.Label3.Caption = "" Then
    Length% = Len(CalForm.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(CalForm.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(CalForm.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".cal"
  Else
    Length% = Len(CalForm.Label3.Caption)
    Temp% = 0
    For Num% = 1 To Length%
      If Mid$(LTrim$(CalForm.Label3.Caption), Num%, 1) = "\" Then
        Temp% = Num%
      End If
    Next
    LoadData.Text1.Text = Mid$(LTrim$(CalForm.Label3.Caption), Temp% + 1, Length% - Temp%)
  End If
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.*"
  LoadData.Show 1
  CalForm.Refresh
  CalForm.Picture1.SetFocus
End Sub

Private Sub SaveAsImageMenu_Click()
  Load LoadData
  LoadData.Caption = "Save Image As"
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.File1.Enabled = 0
  If SurvForm.Label5.Caption = "" Then
    Length% = Len(SurvForm.Label4.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label4.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(SurvForm.Label4.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".img"
  Else
    Length% = Len(SurvForm.Label5.Caption)
    Temp% = 0
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label5.Caption), Num%, 1) = "\" Then
        Temp% = Num%
      End If
    Next
    LoadData.Text1.Text = Mid$(LTrim$(SurvForm.Label5.Caption), Temp% + 1, Length% - Temp%)
  End If
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.*"
  LoadData.Show 1
  SurvForm.Refresh
  SurvForm.Picture4.SetFocus
End Sub

Private Sub SaveAsImageSurveyMenu_Click()
End Sub

Private Sub SaveAsScanMenu_Click()
  Load LoadData
  LoadData.Caption = "Save Scan As"
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.File1.Enabled = 0
  If ScanForm.Label2.Caption = "" Then
    Length% = Len(ScanForm.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(ScanForm.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(ScanForm.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".scn"
  Else
    Length% = Len(ScanForm.Label2.Caption)
    Temp% = 0
    For Num% = 1 To Length%
      If Mid$(LTrim$(ScanForm.Label2.Caption), Num%, 1) = "\" Then
        Temp% = Num%
      End If
    Next
    LoadData.Text1.Text = Mid$(LTrim$(ScanForm.Label2.Caption), Temp% + 1, Length% - Temp%)
  End If
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.*"
  LoadData.Show 1
  ScanForm.Refresh
  ScanForm.Picture1.SetFocus
End Sub

Private Sub SaveAsSurveyMenu_Click()
  Load LoadData
  LoadData.Caption = "Save Survey As"
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.File1.Enabled = 0
  If SurvForm.Label3.Caption = "" Then
    Length% = Len(SurvForm.Label2.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label2.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(SurvForm.Label2.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".srv"
  Else
    Length% = Len(SurvForm.Label3.Caption)
    Temp% = 0
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label3.Caption), Num%, 1) = "\" Then
        Temp% = Num%
      End If
    Next
    LoadData.Text1.Text = Mid$(LTrim$(SurvForm.Label3.Caption), Temp% + 1, Length% - Temp%)
  End If
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.*"
  LoadData.Show 1
  SurvForm.Refresh
  If SurvForm.Picture2.Visible = -1 Then
    SurvForm.Picture2.SetFocus
  ElseIf SurvForm.Picture6.Visible = -1 Then
    SurvForm.Picture6.SetFocus
  ElseIf SurvForm.Picture1.Visible = -1 Then
    SurvForm.Picture1.SetFocus
  End If
End Sub

Private Sub SaveBitmapMenu_Click()
End Sub

Private Sub SaveCalMenu_Click()
  Load LoadData
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.Text1.Text = CalForm.Label3.Caption
  On Error GoTo DirErrr
  Open LoadData.Text1.Text For Output As #1
  Close #1
  LoadData.Caption = "saveplus"
  CalForm.Picture1.SetFocus
Extsub:
  Exit Sub
DirErrr:
  MsgBox Error$, 48, "Error Message"
  Resume Extsub
End Sub

Private Sub SaveImageMenu_Click()
  Load LoadData
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.Text1.Text = SurvForm.Label5.Caption
  On Error GoTo DirrErrorr
  Open LoadData.Text1.Text For Output As #3
  Close #3
  LoadData.Caption = "saveplus"
  SurvForm.Picture4.SetFocus
Exxsubb:
  Exit Sub
DirrErrorr:
  MsgBox Error$, 48, "Error Message"
  Resume Exxsubb
End Sub

Private Sub SaveScanMenu_Click()
  Load LoadData
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.Text1.Text = ScanForm.Label2.Caption
  On Error GoTo DirError
  Open LoadData.Text1.Text For Output As #1
  Close #1
  LoadData.Caption = "saveplus"
  ScanForm.Picture1.SetFocus
Exsub:
  Exit Sub
DirError:
  MsgBox Error$, 48, "Error Message"
  Resume Exsub
End Sub

Private Sub SaveSurveyMenu_Click()
  Load LoadData
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.Text1.Text = SurvForm.Label3.Caption
  On Error GoTo DirrError
  Open LoadData.Text1.Text For Output As #3
  Close #3
  LoadData.Caption = "saveplus"
  If SurvForm.Picture2.Visible = -1 Then
    SurvForm.Picture2.SetFocus
  ElseIf SurvForm.Picture6.Visible = -1 Then
    SurvForm.Picture6.SetFocus
  ElseIf SurvForm.Picture1.Visible = -1 Then
    SurvForm.Picture1.SetFocus
  End If
Exxsub:
  Exit Sub
DirrError:
  MsgBox Error$, 48, "Error Message"
  Resume Exxsub
End Sub

Private Sub ScaleImageMenu_Click()
  Dc$ = InputBox$("Magnifier Size (Degrees):", "Input Magnifier Size", SurvForm.Label6.Caption)
  If (Val(Dc$) <= 0) Or (Val(Dc$) > 90) Then
    MsgBox "Invalid Magnifier Size", 48, "Error Message"
  Else
    SurvForm.Label7.Caption = SurvForm.Label6.Caption
    SurvForm.Label6.Caption = Dc$
  End If
End Sub

Private Sub SelectCalMenu_Click()
  Load LoadData
  LoadData.Caption = "Select Calibration"
  LoadData.Label2.Caption = "*.cal"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.cal"
  LoadData.Show 1
  If LoadData.Caption = "show" Then
    Open LoadData.File1.filename For Input As #1
      Line Input #1, Junk$
      DataForm.CalName.Caption = Junk$
      Line Input #1, Junk$
      DataForm.CalSlope.Caption = Junk$
    Close #1
    If SurvForm.Visible = -1 Then
      If DataForm.Label1.Caption = "" Then
        DataForm.Label1.Caption = "*"
      Else
        DataForm.Label1.Caption = ""
      End If
    Else
      Unload SurvForm
    End If
    If DataForm.CalSlope.Caption = "" Then
      MsgBox "Calibration Not Fit", , DataForm.CalName.Caption
      DataForm.CalName.Caption = ""
    Else
      LoadData.Hide
      LoadData.Caption = "nope"
      If ScanForm.Visible = -1 Then
        Junk$ = ScanForm.Label1.Caption
        ScanForm.Label1.Caption = ""
        ScanForm.Label1.Caption = Junk$
      Else
        Unload ScanForm
      End If
    End If
    Unload LoadData
  Else
    Unload LoadData
  End If
End Sub

Private Sub SubImageMenu_Click()
End Sub

Private Sub SuperImageMenu_Click()
  Load LoadData
  LoadData.Caption = "Superimpose Image"
  LoadData.Label2.Caption = "*.img"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.img"
  LoadData.Show 1
  SurvForm.Refresh
  If LoadData.Caption = "super" Then
    SurvForm.Picture4.SetFocus
  Else
    Unload LoadData
  End If
End Sub

Private Sub SweepSurveyMenu_Click()
  Load LoadData
  LoadData.Caption = "sweep"
  If SurvForm.Picture2.Visible = -1 Then
    SurvForm.Picture2.SetFocus
  ElseIf SurvForm.Picture6.Visible = -1 Then
    SurvForm.Picture6.SetFocus
  ElseIf SurvForm.Picture1.Visible = -1 Then
    SurvForm.Picture1.SetFocus
  End If
End Sub

Private Sub TriColorImageMenu_Click()

  Load LoadData
  LoadData.Caption = "Select Third Image"
  LoadData.Label2.Caption = "*.img"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.img"
  LoadData.Show 1
  SurvForm.Refresh
  If LoadData.Caption = "tricolor" Then
    SurvForm.Picture4.SetFocus
  Else
    Unload LoadData
  End If

End Sub

Private Sub WindowImageMenu_Click()
  DataForm.Show 1
End Sub

