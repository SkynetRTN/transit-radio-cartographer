VERSION 5.00
Begin VB.Form CalForm 
   Appearance      =   0  'Flat
   AutoRedraw      =   -1  'True
   BackColor       =   &H80000005&
   BorderStyle     =   1  'Fixed Single
   Caption         =   "Form1"
   ClientHeight    =   4455
   ClientLeft      =   1485
   ClientTop       =   1635
   ClientWidth     =   6615
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
   ScaleHeight     =   4455
   ScaleWidth      =   6615
   Begin VB.PictureBox Picture1 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   3855
      Left            =   480
      ScaleHeight     =   3825
      ScaleWidth      =   3825
      TabIndex        =   4
      Top             =   120
      Width           =   3855
   End
   Begin VB.CommandButton Command4 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   4560
      TabIndex        =   3
      Top             =   2520
      Width           =   1815
   End
   Begin VB.CommandButton Command3 
      Appearance      =   0  'Flat
      Caption         =   "Cut Source"
      Enabled         =   0   'False
      Height          =   495
      Left            =   4560
      TabIndex        =   2
      Top             =   1920
      Width           =   1815
   End
   Begin VB.CommandButton Command2 
      Appearance      =   0  'Flat
      Caption         =   "Fit Calibration"
      Enabled         =   0   'False
      Height          =   495
      Left            =   4560
      TabIndex        =   1
      Top             =   720
      Width           =   1815
   End
   Begin VB.CommandButton Command1 
      Appearance      =   0  'Flat
      Caption         =   "Add Source"
      Height          =   495
      Left            =   4560
      TabIndex        =   0
      Top             =   120
      Width           =   1815
   End
   Begin VB.Label Label3 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   4560
      TabIndex        =   7
      Top             =   3120
      Visible         =   0   'False
      Width           =   2055
   End
   Begin VB.Label Label2 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   4560
      TabIndex        =   6
      Top             =   1610
      Width           =   1935
   End
   Begin VB.Label Label1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   4560
      TabIndex        =   5
      Top             =   1350
      Width           =   2055
   End
End
Attribute VB_Name = "CalForm"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim MFlux(100)
Dim KFlux(100)
Dim Nm$(100)
Dim CalNum%
Dim Junk$
Dim Length%
Dim MaxMF
Dim MaxKF
Dim Num%
Dim XTemp%
Dim YTemp%
Dim Dist
Dim MemNum%
Dim XTmp
Dim YTmp
Dim Jy$
Dim CutSeg$
Dim FitSeg$
Dim Slope
Dim Errr
Dim Nmm$

Private Sub Command1_Click()
  Load LoadData
  LoadData.Caption = "Add Source"
  LoadData.Label2.Caption = "*.scn"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.scn"
  LoadData.Show 1
  CalForm.Refresh
  If LoadData.Caption = "show" Then
    Open LoadData.File1.filename For Input As #1
      Line Input #1, Nm$(CalNum% + 1)
      Line Input #1, Junk$
      Line Input #1, Junk$
      If Junk$ <> "" Then
        CalNum% = CalNum% + 1
        Length% = Len(Junk$)
        MFlux(CalNum%) = Val(Right$(Junk$, Length% - 11))
        If LCase$(Left$(Nm$(CalNum%), 3)) = "vir" Then
          Jy$ = "213"
        ElseIf LCase$(Left$(Nm$(CalNum%), 3)) = "tau" Then
          Jy$ = "942"
        ElseIf LCase$(Left$(Nm$(CalNum%), 3)) = "cyg" Then
          Jy$ = "1581"
        Else
          Jy$ = "0"
        End If
        KFlux(CalNum%) = Val(InputBox$("Known Flux (Jy):", Nm$(CalNum%), Jy$))
        If KFlux(CalNum%) <> 0 Then
          CalForm.Label1.Caption = ""
          CalForm.Label2.Caption = ""
          CutSeg$ = "N"
          FitSeg$ = "N"
          CalForm.Command2.Enabled = -1
          CalForm.Command3.Enabled = -1
          MaxMF = -1000
          MaxKF = -1000
          For Num% = 1 To CalNum%
            If MFlux(Num%) > MaxMF Then
              MaxMF = MFlux(Num%)
            End If
            If KFlux(Num%) > MaxKF Then
              MaxKF = KFlux(Num%)
            End If
          Next
          CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
          For Num% = 1 To CalNum%
            XTemp% = MFlux(Num%) / MaxMF * 3810
            YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
            CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
          Next
          CalForm.Refresh
        Else
          CalNum% = CalNum% - 1
        End If
      Else
        MsgBox "Peak Flux Not Determined", , Nm$(CalNum% + 1)
      End If
    Close #1
  End If
  Unload LoadData
End Sub

Private Sub Command2_Click()
  FitSeg$ = "Y"
  CalForm.Label1.Caption = ""
  CalForm.Label2.Caption = ""
  CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
  For Num% = 1 To CalNum%
    XTemp% = MFlux(Num%) / MaxMF * 3810
    YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
    CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
  Next
  CalForm.Refresh
  CutSeg$ = "N"
End Sub

Private Sub Command3_Click()
  CutSeg$ = "Y"
  CalForm.Label1.Caption = ""
  CalForm.Label2.Caption = ""
  CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
  For Num% = 1 To CalNum%
    XTemp% = MFlux(Num%) / MaxMF * 3810
    YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
    CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
  Next
  CalForm.Refresh
  FitSeg$ = "N"
End Sub

Private Sub Command4_Click()
  If CutSeg$ = "Y" Or FitSeg$ = "Y" Then
    CalForm.Label1.Caption = ""
    CalForm.Label2.Caption = ""
    CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
    For Num% = 1 To CalNum%
      XTemp% = MFlux(Num%) / MaxMF * 3810
      YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
      CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
    Next
    CalForm.Refresh
    CutSeg$ = "N"
    FitSeg$ = "N"
  Else
  
  Opt% = 3 Or 32
  Button% = MsgBox("Save Changes to Open Calibration?", Opt%, "Status Message")
  If Button% = 6 And CalForm.Label3.Caption <> "" Then
    On Error GoTo DirError
    Open CalForm.Label3.Caption For Output As #1
    Print #1, CalForm.Caption
    Print #1, CalForm.Label1.Caption
    Print #1, CalForm.Label2.Caption
    Print #1, MaxMF
    Print #1, MaxKF
    Print #1, CalNum%
    For Num% = 1 To CalNum%
      Print #1, Nm$(Num%)
      Print #1, MFlux(Num%)
      Print #1, KFlux(Num%)
    Next
    Close #1
  ElseIf Button% = 6 Then
    Load LoadData
    LoadData.Caption = "Save Calibration As"
    LoadData.Text1.Enabled = -1
    LoadData.Text1.Visible = -1
    LoadData.File1.Enabled = 0
    Length% = Len(CalForm.Caption)
    Nmm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(CalForm.Caption), Num%, 1) <> " " Then
        Nmm$ = Nmm$ + Mid$(LTrim$(CalForm.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nmm$, 8)) + ".cal"
    LoadData.Label4.Caption = LoadData.Dir1.Path
    LoadData.File1.Pattern = "*.*"
    LoadData.Show 1
    CalForm.Refresh
    If LoadData.Caption = "save" Then
      Open LoadData.Text1.Text For Output As #1
      Print #1, CalForm.Caption
      Print #1, CalForm.Label1.Caption
      Print #1, CalForm.Label2.Caption
      Print #1, MaxMF
      Print #1, MaxKF
      Print #1, CalNum%
      For Num% = 1 To CalNum%
        Print #1, Nm$(Num%)
        Print #1, MFlux(Num%)
        Print #1, KFlux(Num%)
      Next
      Close #1
    End If
    Unload LoadData
  End If
  If Button% <> 2 Then
    Karaleah.SaveCalMenu.Enabled = 0
    Karaleah.SaveAsCalMenu.Enabled = 0
    Karaleah.NameCalMenu.Enabled = 0
    Karaleah.PrintCalMenu.Enabled = 0
    Unload CalForm
  End If
  
  End If
Exsub:
  Exit Sub
DirError:
  MsgBox Error$, 48, "Error Message"
  Resume Exsub
End Sub

Private Sub Form_Load()
  FitSeg$ = "N"
  CutSeg$ = "N"
  CalNum% = 0
  If LoadData.Caption = "" Then
    Karaleah.SaveCalMenu.Enabled = 0
    Karaleah.SaveAsCalMenu.Enabled = -1
    Karaleah.NameCalMenu.Enabled = -1
    Karaleah.PrintCalMenu.Enabled = -1
    CurrentY = 1080
    CurrentX = 180
    Print "K"
    CurrentX = 180
    Print "n"
    CurrentX = 180
    Print "o"
    CurrentX = 165
    Print "w"
    CurrentX = 180
    Print "n"
    Print
    CurrentX = 180
    Print "F"
    CurrentX = 210
    Print "l"
    CurrentX = 180
    Print "u"
    CurrentX = 180
    Print "x"
    CurrentY = 4080
    CurrentX = 1800
    Print "Measured Flux"
  End If
  If LoadData.Caption <> "Open Calibration" And LoadData.Caption <> "" Then
      
  Karaleah.SaveCalMenu.Enabled = 0
  Karaleah.SaveAsCalMenu.Enabled = -1
  Karaleah.NameCalMenu.Enabled = -1
  Karaleah.PrintCalMenu.Enabled = -1
  CurrentY = 1080
  CurrentX = 180
  Print "K"
  CurrentX = 180
  Print "n"
  CurrentX = 180
  Print "o"
  CurrentX = 165
  Print "w"
  CurrentX = 180
  Print "n"
  Print
  CurrentX = 180
  Print "F"
  CurrentX = 210
  Print "l"
  CurrentX = 180
  Print "u"
  CurrentX = 180
  Print "x"
  CurrentY = 4080
  CurrentX = 1800
  Print "Measured Flux"
  If LoadData.Caption = "show" Then
  
  Karaleah.SaveCalMenu = -1
  Open LoadData.File1.filename For Input As #1
    Line Input #1, Junk$
    CalForm.Caption = Junk$
    Show
    CalForm.Refresh
    Line Input #1, Junk$
    CalForm.Label1.Caption = Junk$
    Line Input #1, Junk$
    CalForm.Label2.Caption = Junk$
    Line Input #1, Junk$
    MaxMF = Val(Junk$)
    Line Input #1, Junk$
    MaxKF = Val(Junk$)
    Line Input #1, Junk$
    CalNum% = Val(Junk$)
    If CalNum% <> 0 Then
      CalForm.Command2.Enabled = -1
      CalForm.Command3.Enabled = -1
    End If
    For Num% = 1 To CalNum%
      Line Input #1, Nm$(Num%)
      Line Input #1, Junk$
      MFlux(Num%) = Val(Junk$)
      Line Input #1, Junk$
      KFlux(Num%) = Val(Junk$)
    Next
  Close #1
  CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
  If CalForm.Label1.Caption <> "" Then
    Length% = Len(CalForm.Label1.Caption)
    Slope = Val(Mid$(CalForm.Label1.Caption, 8, Length% - 10))
    YTmp = Slope / MaxKF * MaxMF * 3810
    If YTmp <= 3810 Then
      CalForm.Picture1.Line (0, 3810)-(3810, 3810 - YTmp), QBColor(13)
    ElseIf Slope <> 0 Then
      XTmp = MaxKF / MaxMF / Slope * 3810
      CalForm.Picture1.Line (0, 3810)-(XTmp, 0), QBColor(13)
    Else
      CalForm.Picture1.Line (0, 3810)-(3810, 3810)
    End If
  End If
  For Num% = 1 To CalNum%
    XTemp% = MFlux(Num%) / MaxMF * 3810
    YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
    CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
  Next
  CalForm.Refresh
  
  Else
    Unload LoadData
  End If

  End If
End Sub

Private Sub Picture1_GotFocus()
  If LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Then
    Open LoadData.Text1.Text For Output As #1
    Print #1, CalForm.Caption
    Print #1, CalForm.Label1.Caption
    Print #1, CalForm.Label2.Caption
    Print #1, MaxMF
    Print #1, MaxKF
    Print #1, CalNum%
    For Num% = 1 To CalNum%
      Print #1, Nm$(Num%)
      Print #1, MFlux(Num%)
      Print #1, KFlux(Num%)
    Next
    Close #1
    If LoadData.Caption = "save" Then
      CalForm.Label3.Caption = LoadData.Label4.Caption + "\" + LoadData.Text1.Text
    End If
    Karaleah.SaveCalMenu.Enabled = -1
  End If
  If LoadData.Caption <> "show" Then
    Unload LoadData
  End If
End Sub

Private Sub Picture1_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If (CutSeg$ = "Y" Or FitSeg$ = "Y") And Button% = 2 Then
    CalForm.Label1.Caption = ""
    CalForm.Label2.Caption = ""
    CalForm.Label3.Caption = ""
    CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
    For Num% = 1 To CalNum%
      XTemp% = MFlux(Num%) / MaxMF * 3810
      YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
      CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
    Next
    CalForm.Refresh
    CutSeg$ = "N"
    FitSeg$ = "N"
  ElseIf FitSeg$ = "Y" And Button% = 1 And CalForm.Label1.Caption <> "" Then
    FitSeg$ = "N"
  Else
  
  Dist = 50
  MemNum% = 0
  For Num% = 1 To CalNum%
    XTmp = X - MFlux(Num%) / MaxMF * 3810
    YTmp = Y - 3810 + KFlux(Num%) / MaxKF * 3810
    If (XTmp ^ 2 + YTmp ^ 2) ^ 0.5 <= Dist Then
      Dist = (XTmp ^ 2 + YTmp ^ 2) ^ 0.5
      MemNum% = Num%
    End If
  Next
  If MemNum% <> 0 Then
    If CutSeg$ <> "Y" Then
      MsgBox Nm$(MemNum), , "Source Name"
    Else
      For Num% = MemNum% + 1 To CalNum%
        Nm$(Num% - 1) = Nm$(Num%)
        MFlux(Num% - 1) = MFlux(Num%)
        KFlux(Num% - 1) = KFlux(Num%)
      Next
      CalNum% = CalNum% - 1
      MaxMF = -1000
      MaxKF = -1000
      For Num% = 1 To CalNum%
        If MFlux(Num%) > MaxMF Then
          MaxMF = MFlux(Num%)
        End If
        If KFlux(Num%) > MaxKF Then
          MaxKF = KFlux(Num%)
        End If
      Next
      If CalNum% = 0 Then
        CutSeg$ = "N"
        CalForm.Command2.Enabled = 0
        CalForm.Command3.Enabled = 0
      End If
      CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
      For Num% = 1 To CalNum%
        XTemp% = MFlux(Num%) / MaxMF * 3810
        YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
        CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
      Next
      CalForm.Refresh
    End If
  End If

  End If
End Sub

Private Sub Picture1_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" Then
    CalForm.FontTransparent = 0
    CurrentY = 3720
    CurrentX = 4560
    Print "                                   "
    CurrentX = 4560
    Print "                                   "
    CalForm.FontTransparent = -1
    CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
    CalForm.Picture1.FillStyle = 0
    CalForm.Picture1.FillColor = QBColor(10)
    CalForm.Picture1.Circle (X, Y), 50, QBColor(10)
    CalForm.Picture1.FillStyle = 1
    For Num% = 1 To CalNum%
      XTemp% = MFlux(Num%) / MaxMF * 3810
      YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
      CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
    Next
    CalForm.Refresh
  ElseIf FitSeg$ = "Y" Then
    CalForm.FontTransparent = 0
    CurrentY = 3720
    CurrentX = 4560
    Print "                                   "
    CurrentX = 4560
    Print "                                   "
    CalForm.FontTransparent = -1
    CalForm.Picture1.Line (0, 0)-(3810, 3810), QBColor(15), BF
    If X <> 0 Then
      Slope = (3810 - Y) / X * MaxKF / MaxMF
      Errr = 0
      For Num% = 1 To CalNum%
        Errr = Errr + (Slope * MFlux(Num%) - KFlux(Num%)) ^ 2
      Next
      If CalNum% > 1 Then
        Errr = Format$((Errr / (CalNum% - 1)) ^ 0.5, "#.###")
      End If
      If Slope <> 0 Then
        CalForm.Label1.Caption = "Slope: " + Format$(Slope, "#") + " Jy"
      Else
        CalForm.Label1.Caption = "Slope: 0 Jy"
      End If
      If CalNum% > 1 Then
        CalForm.Label2.Caption = "Error: " + Errr + " Jy"
      End If
      YTmp = (3810 - Y) / X * 3810
      If YTmp <= 3810 Then
        CalForm.Picture1.Line (0, 3810)-(3810, 3810 - YTmp), QBColor(13)
      ElseIf Y <> 3810 Then
        XTmp = X / (3810 - Y) * 3810
        CalForm.Picture1.Line (0, 3810)-(XTmp, 0), QBColor(13)
      Else
        CalForm.Picture1.Line (0, 3810)-(3810, 3810)
      End If
    Else
      CalForm.Label1.Caption = ""
      CalForm.Picture1.Line (0, 3810)-(0, 0), QBColor(13)
    End If
    For Num% = 1 To CalNum%
      XTemp% = MFlux(Num%) / MaxMF * 3810
      YTemp% = 3810 - KFlux(Num%) / MaxKF * 3810
      CalForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
    Next
    CalForm.Refresh

  Else
  
  If CalNum% >= 1 Then
    X = X / 3810 * MaxMF
    Y = (3810 - Y) / 3810 * MaxKF
    CalForm.FontTransparent = 0
    CurrentY = 3720
    CurrentX = 4560
    Print "                                   "
    CurrentX = 4560
    Print "                                   "
    CalForm.FontTransparent = -1
    CurrentY = 3720
    CurrentX = 4560
    Print "Measured Flux: ";
    If Abs(X) < 0.0005 Then
      Print "0"
    Else
      Print Format$(Abs(X), "#.###")
    End If
    CurrentX = 4560
    Print "Known Flux: ";
    If Abs(Y) < 0.5 Then
      Print "0";
    Else
      Print Format$(Abs(Y), "#");
    End If
    Print " Jy"
    CalForm.Refresh
  End If

  End If
End Sub

