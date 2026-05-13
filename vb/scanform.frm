VERSION 5.00
Begin VB.Form ScanForm 
   Appearance      =   0  'Flat
   AutoRedraw      =   -1  'True
   BackColor       =   &H80000005&
   BorderStyle     =   1  'Fixed Single
   Caption         =   "Form1"
   ClientHeight    =   5055
   ClientLeft      =   375
   ClientTop       =   1710
   ClientWidth     =   8775
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
   ScaleHeight     =   5055
   ScaleWidth      =   8775
   Begin VB.CheckBox Check2 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   6720
      TabIndex        =   17
      Top             =   3480
      Value           =   1  'Checked
      Visible         =   0   'False
      Width           =   255
   End
   Begin VB.CheckBox Check1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   6720
      TabIndex        =   16
      Top             =   3240
      Value           =   1  'Checked
      Visible         =   0   'False
      Width           =   255
   End
   Begin VB.PictureBox Picture6 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   3600
      ScaleHeight     =   2145
      ScaleWidth      =   2865
      TabIndex        =   15
      Top             =   2760
      Visible         =   0   'False
      Width           =   2895
   End
   Begin VB.PictureBox Picture5 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   480
      ScaleHeight     =   2145
      ScaleWidth      =   2865
      TabIndex        =   14
      Top             =   2760
      Visible         =   0   'False
      Width           =   2895
   End
   Begin VB.PictureBox Picture4 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   3600
      ScaleHeight     =   2145
      ScaleWidth      =   2865
      TabIndex        =   13
      Top             =   120
      Visible         =   0   'False
      Width           =   2895
   End
   Begin VB.PictureBox Picture3 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   480
      ScaleHeight     =   2145
      ScaleWidth      =   2865
      TabIndex        =   12
      Top             =   120
      Visible         =   0   'False
      Width           =   2895
   End
   Begin VB.CommandButton Command10 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   6720
      TabIndex        =   11
      Top             =   2160
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command9 
      Appearance      =   0  'Flat
      Caption         =   "Select Declination"
      Height          =   495
      Left            =   6720
      TabIndex        =   10
      Top             =   1560
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command8 
      Appearance      =   0  'Flat
      Caption         =   "Cut Segment"
      Height          =   495
      Left            =   6720
      TabIndex        =   9
      Top             =   960
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command7 
      Appearance      =   0  'Flat
      Caption         =   "Calibrate Scan"
      Default         =   -1  'True
      Enabled         =   0   'False
      Height          =   495
      Left            =   6720
      TabIndex        =   8
      Top             =   120
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command6 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   6720
      TabIndex        =   7
      Top             =   3480
      Width           =   1815
   End
   Begin VB.CommandButton Command5 
      Appearance      =   0  'Flat
      Caption         =   "Cut Segment"
      Enabled         =   0   'False
      Height          =   495
      Left            =   6720
      TabIndex        =   6
      Top             =   2880
      Width           =   1815
   End
   Begin VB.CommandButton Command4 
      Appearance      =   0  'Flat
      Caption         =   "Determine Peak"
      Enabled         =   0   'False
      Height          =   495
      Left            =   6720
      TabIndex        =   5
      Top             =   1920
      Width           =   1815
   End
   Begin VB.CommandButton Command3 
      Appearance      =   0  'Flat
      Caption         =   "Baseline Source"
      Enabled         =   0   'False
      Height          =   495
      Left            =   6720
      TabIndex        =   4
      Top             =   1320
      Width           =   1815
   End
   Begin VB.CommandButton Command2 
      Appearance      =   0  'Flat
      Caption         =   "Select Declination"
      Enabled         =   0   'False
      Height          =   495
      Left            =   6720
      TabIndex        =   3
      Top             =   720
      Width           =   1815
   End
   Begin VB.CommandButton Command1 
      Appearance      =   0  'Flat
      Caption         =   "Calibrate Scan"
      Height          =   495
      Left            =   6720
      TabIndex        =   2
      Top             =   120
      Width           =   1815
   End
   Begin VB.PictureBox Picture2 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   480
      ScaleHeight     =   2145
      ScaleWidth      =   5970
      TabIndex        =   1
      Top             =   2760
      Width           =   6000
   End
   Begin VB.PictureBox Picture1 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   480
      ScaleHeight     =   2145
      ScaleWidth      =   5970
      TabIndex        =   0
      Top             =   120
      Width           =   6000
   End
   Begin VB.Label Label3 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   6720
      TabIndex        =   20
      Top             =   2550
      Width           =   1815
   End
   Begin VB.Label Label2 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   5040
      TabIndex        =   19
      Top             =   2400
      Visible         =   0   'False
      Width           =   1455
   End
   Begin VB.Label Label1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   6720
      TabIndex        =   18
      Top             =   2520
      Visible         =   0   'False
      Width           =   1815
   End
End
Attribute VB_Name = "ScanForm"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim Ra(3850)
Dim Dec(3850)
Dim Flux(3850)
Dim Check%(3850)
Dim Num%
Dim Junk$
Dim R$
Dim Dc$
Dim Flx$
Dim Total%
Dim MinDec
Dim MaxDec
Dim MinFlux
Dim MaxFlux
Dim MinDec1
Dim MaxDec1
Dim MinFlux1
Dim MaxFlux1
Dim MinDec2
Dim MaxDec2
Dim MinFlux2
Dim MaxFlux2
Dim X%
Dim Y%
Dim Hrs%
Dim Min%
Dim Secs%
Dim CalA
Dim CalB
Dim Cal1
Dim Cal2
Dim SelSeg$
Dim CutSeg$
Dim BaseSeg$
Dim PeakSeg$
Dim Down1$
Dim Down2$
Dim Down3$
Dim Down4$
Dim XBeg%
Dim YBeg%
Dim XTemp%
Dim YTemp%
Dim YTmp
Dim MinMem
Dim MaxMem
Dim Tot1%
Dim Tot2%
Dim Cal$
Dim YPlus
Dim XPlus
Dim B
Dim Peak$
Dim Cnt%
Dim RaTemp
Dim DecTemp
Dim FluxTemp
Dim CheckTemp%
Dim Length%
Dim Slope
Dim Pk
Dim Pkk$
Dim Wait$

Private Sub Check1_Click()
  If ScanForm.Check1.Value = 0 And ScanForm.Check2.Value = 0 Then
    ScanForm.Command7.Enabled = 0
  Else
    ScanForm.Command7.Enabled = -1
  End If
  ScanForm.Refresh
End Sub

Private Sub Check2_Click()
  If ScanForm.Check1.Value = 0 And ScanForm.Check2.Value = 0 Then
    ScanForm.Command7.Enabled = 0
  Else
    ScanForm.Command7.Enabled = -1
  End If
  ScanForm.Refresh
End Sub

Private Sub Command1_Click()
  ScanForm.Command7.Enabled = -1
  ScanForm.Command1.Visible = 0
  ScanForm.Command2.Visible = 0
  ScanForm.Command3.Visible = 0
  ScanForm.Command4.Visible = 0
  ScanForm.Command5.Visible = 0
  ScanForm.Command6.Visible = 0
  ScanForm.Command7.Visible = -1
  ScanForm.Command8.Visible = -1
  ScanForm.Command9.Visible = -1
  ScanForm.Command10.Visible = -1
  ScanForm.Check1.Visible = -1
  ScanForm.Check2.Visible = -1
  ScanForm.Picture1.Visible = 0
  ScanForm.Picture2.Visible = 0
  ScanForm.Picture3.Visible = -1
  ScanForm.Picture4.Visible = -1
  ScanForm.Picture5.Visible = -1
  ScanForm.Picture6.Visible = -1
  CurrentY = 3000
  CurrentX = 6720
  Print "Calibrations"
  ScanForm.FontTransparent = 0
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  ScanForm.FontTransparent = -1
  ScanForm.Refresh
  
  MinDec1 = 1000
  MaxDec1 = -1000
  MinFlux1 = 100
  MaxFlux1 = -100
  For Num% = 1 To 120
    If Dec(Num%) < MinDec1 Then
      MinDec1 = Dec(Num%)
    ElseIf Dec(Num%) > MaxDec1 Then
      MaxDec1 = Dec(Num%)
    End If
    If Flux(Num%) < MinFlux1 Then
      MinFlux1 = Flux(Num%)
    End If
    If Flux(Num%) > MaxFlux1 Then
      MaxFlux1 = Flux(Num%)
    End If
  Next
  MinDec2 = 1000
  MaxDec2 = -1000
  MinFlux2 = 100
  MaxFlux2 = -100
  For Num% = Total% + 121 To Total% + 240
    If Dec(Num%) < MinDec2 Then
      MinDec2 = Dec(Num%)
    ElseIf Dec(Num%) > MaxDec2 Then
      MaxDec2 = Dec(Num%)
    End If
    If Flux(Num%) < MinFlux2 Then
      MinFlux2 = Flux(Num%)
    End If
    If Flux(Num%) > MaxFlux2 Then
      MaxFlux2 = Flux(Num%)
    End If
  Next

  If MaxDec1 = MinDec1 Then
    MaxDec1 = MaxDec1 + 0.5
    MinDec1 = MinDec1 - 0.5
  End If
  If MaxDec2 = MinDec2 Then
    MaxDec2 = MaxDec2 + 0.5
    MinDec2 = MinDec2 - 0.5
  End If
  If MaxFlux1 = MinFlux1 Then
    MaxFlux1 = MaxFlux1 + 0.5
    MinFlux1 = MinFlux1 - 0.5
  End If
  If MaxFlux2 = MinFlux2 Then
    MaxFlux2 = MaxFlux2 + 0.5
    MinFlux2 = MinFlux2 - 0.5
  End If
  ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
  X = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
  ScanForm.Picture3.Line (X, 0)-(X, 2145), QBColor(8)
  ScanForm.Picture5.Line (X, 0)-(X, 2145), QBColor(8)
  X = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total + 121)) * 2850
  ScanForm.Picture4.Line (X, 0)-(X, 2145), QBColor(8)
  ScanForm.Picture6.Line (X, 0)-(X, 2145), QBColor(8)
  For Num% = 1 To 120
    X = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    Y = 2130 - (Flux(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
    ScanForm.Picture3.Circle (X%, Y%), 15, QBColor(12)
    Y = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
    ScanForm.Picture5.Circle (X%, Y%), 15, QBColor(9)
  Next
  For Num% = Total% + 121 To Total% + 240
    X = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    Y = 2130 - (Flux(Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
    ScanForm.Picture4.Circle (X%, Y%), 15, QBColor(12)
    Y = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
    ScanForm.Picture6.Circle (X%, Y%), 15, QBColor(9)
  Next
  ScanForm.Refresh
  
  Cal1 = 0
  Cal2 = 0
  For Num% = 1 To 60
    Cal1 = Cal1 + Flux(Num%) - Flux(Num% + 60)
    Cal2 = Cal2 + Flux(Total% + 120 + Num%) - Flux(Total + 180 + Num%)
  Next
  Cal1 = Cal1 / 60
  Cal2 = Cal2 / 60
  CurrentY = 3285
  CurrentX = 6960
  If Cal1 > 1 Then
    Print "Initial:"; Left$(Str$(Cal1), 6); " V"
  Else
    Print "Initial:"; Left$(Str$(Cal1), 5); " V"
  End If
  CurrentY = 3525
  CurrentX = 6960
  If Cal2 > 1 Then
    Print "Terminal:"; Left$(Str$(Cal2), 6); " V"
  Else
    Print "Terminal:"; Left$(Str$(Cal2), 5); " V"
  End If
  ScanForm.Refresh
End Sub

Private Sub Command10_Click()
  If CutSeg$ = "Y" And Down1$ = "Y" Then
    ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture3.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture3.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  If CutSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture4.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture4.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture4.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  If SelSeg$ = "Y" And Down3$ = "Y" Then
    ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture5.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture5.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture5.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  End If
  If SelSeg$ = "Y" And Down4$ = "Y" Then
    ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture6.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture6.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture6.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  End If

  If (Down1$ <> "Y") And (Down2$ <> "Y") And (Down3$ <> "Y") And (Down4$ <> "Y") Then

  ScanForm.Command7.Visible = 0
  ScanForm.Command8.Visible = 0
  ScanForm.Command9.Visible = 0
  ScanForm.Command10.Visible = 0
  ScanForm.Command1.Visible = -1
  ScanForm.Command2.Visible = -1
  ScanForm.Command3.Visible = -1
  ScanForm.Command4.Visible = -1
  ScanForm.Command5.Visible = -1
  ScanForm.Command6.Visible = -1
  ScanForm.Check1.Value = 1
  ScanForm.Check2.Value = 1
  ScanForm.Check1.Visible = 0
  ScanForm.Check2.Visible = 0
  ScanForm.Check1.Enabled = -1
  ScanForm.Check2.Enabled = -1
  ScanForm.Picture3.Visible = 0
  ScanForm.Picture4.Visible = 0
  ScanForm.Picture5.Visible = 0
  ScanForm.Picture6.Visible = 0
  ScanForm.Picture1.Visible = -1
  ScanForm.Picture2.Visible = -1
  ScanForm.FontTransparent = 0
  CurrentY = 3285
  CurrentX = 6960
  Print "                        "
  CurrentY = 3525
  CurrentX = 6960
  Print "                        "
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  ScanForm.FontTransparent = -1
  ScanForm.Refresh
  ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
  For Num% = 1 To 120
    Check%(Num%) = 0
  Next
  For Num% = Total% + 121 To Total% + 240
    Check%(Num%) = 0
  Next
  
  End If
  CutSeg$ = "N"
  SelSeg$ = "N"
  Down1$ = "N"
  Down2$ = "N"
  Down3$ = "N"
  Down4$ = "N"
End Sub

Private Sub Command2_Click()
  SelSeg$ = "Y"
  If Down2$ <> "Y" Then
    Down2$ = "N"
  End If

  If CutSeg$ = "Y" And Down1$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  CutSeg$ = "N"
  Down1$ = "N"
End Sub

Private Sub Command3_Click()
  BaseSeg$ = "Y"
  If Down2$ <> "Y" Then
    Down2$ = "N"
  End If

  If CutSeg$ = "Y" And Down1$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  If PeakSeg$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  CutSeg$ = "N"
  PeakSeg$ = "N"
  Down1$ = "N"
End Sub

Private Sub Command4_Click()
  PeakSeg$ = "Y"

  If CutSeg$ = "Y" And Down1$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  If BaseSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  CutSeg$ = "N"
  BaseSeg$ = "N"
  Down1$ = "N"
  Down2$ = "N"
End Sub

Private Sub Command5_Click()
  CutSeg$ = "Y"
  If Down1$ <> "Y" Then
    Down1$ = "N"
  End If

  If SelSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.Picture2.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture2.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  End If
  If BaseSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  If PeakSeg$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  SelSeg$ = "N"
  BaseSeg$ = "N"
  PeakSeg$ = "N"
  Down2$ = "N"
End Sub

Private Sub Command6_Click()
  If CutSeg$ = "Y" And Down1$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  If SelSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture2.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  End If
  If BaseSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  If PeakSeg$ = "Y" Then
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If

  If (Down1$ <> "Y") And (Down2$ <> "Y") And (PeakSeg$ <> "Y") And (Cal$ = "Y") Then

  Opt% = 3 Or 32
  Button% = MsgBox("Save Changes to Open Scan?", Opt%, "Status Message")
  If Button% = 6 And ScanForm.Label2.Caption <> "" Then
    On Error GoTo DirError
    Open ScanForm.Label2.Caption For Output As #1
    Print #1, ScanForm.Caption
    If ScanForm.Command2.Enabled = -1 Then
      Print #1, "A"
    Else
      Print #1, "B"
    End If
    Print #1, Peak$
    Print #1, MinDec
    Print #1, MaxDec
    Print #1, Format$(MinFlux, "#.####")
    Print #1, Format$(MaxFlux, "#.####")
    Print #1, Total%
    For Num% = 1 To Total%
      Print #1, Check%(Num%)
      Print #1, Ra(Num%)
      Print #1, Dec(Num%)
      Print #1, Format$(Flux(Num%), "#.####")
    Next
    Close #1
  ElseIf Button% = 6 Then
    Load LoadData
    LoadData.Caption = "Save Scan As"
    LoadData.Text1.Enabled = -1
    LoadData.Text1.Visible = -1
    LoadData.File1.Enabled = 0
    Length% = Len(ScanForm.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(ScanForm.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(ScanForm.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".scn"
    LoadData.Label4.Caption = LoadData.Dir1.Path
    LoadData.File1.Pattern = "*.*"
    LoadData.Show 1
    ScanForm.Refresh
    If LoadData.Caption = "save" Then
      Open LoadData.Text1.Text For Output As #1
      Print #1, ScanForm.Caption
      If ScanForm.Command2.Enabled = -1 Then
        Print #1, "A"
      Else
        Print #1, "B"
      End If
      Print #1, Peak$
      Print #1, MinDec
      Print #1, MaxDec
      Print #1, Format$(MinFlux, "#.####")
      Print #1, Format$(MaxFlux, "#.####")
      Print #1, Total%
      For Num% = 1 To Total%
        Print #1, Check%(Num%)
        Print #1, Ra(Num%)
        Print #1, Dec(Num%)
        Print #1, Format$(Flux(Num%), "#.####")
      Next
      Close #1
    Else
      Wait$ = "Y"
    End If
    Unload LoadData
  End If
  If Button% <> 2 And Wait$ <> "Y" Then
    For Num% = 1 To Total%
      Check%(Num%) = 0
    Next
    Karaleah.SaveScanMenu.Enabled = 0
    Karaleah.SaveAsScanMenu.Enabled = 0
    Karaleah.AppendScanMenu.Enabled = 0
    Karaleah.PrintScanMenu.Enabled = 0
    Karaleah.NameScanMenu.Enabled = 0
    Unload ScanForm
  ElseIf Wait$ = "Y" Then
    Wait$ = "N"
  End If
  
  ElseIf (Down1$ <> "Y") And (Down2$ <> "Y") And (PeakSeg$ <> "Y") And (Cal$ <> "Y") Then
    
    Opt% = 1 Or 48
    Button% = MsgBox("Open Scan Will Be Discarded", Opt%, "Status Message")
    If Button% = 1 Then
      For Num% = 1 To Total%
        Check%(Num%) = 0
      Next
      Karaleah.SaveScanMenu.Enabled = 0
      Karaleah.SaveAsScanMenu.Enabled = 0
      Karaleah.AppendScanMenu.Enabled = 0
      Karaleah.NameScanMenu.Enabled = 0
      Unload ScanForm
    End If
  End If
  CutSeg$ = "N"
  SelSeg$ = "N"
  BaseSeg$ = "N"
  PeakSeg$ = "N"
  Down1$ = "N"
  Down2$ = "N"
Exsub:
  Exit Sub
DirError:
  MsgBox Error$, 48, "Error Message"
  Resume Exsub
End Sub

Private Sub Command7_Click()
  ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
  ScanForm.Picture2.Line (0, 0)-(5955, 2130), QBColor(15), BF
  ScanForm.Command1.Enabled = 0
  ScanForm.Command2.Enabled = -1
  ScanForm.Command5.Enabled = -1
  ScanForm.Command7.Visible = 0
  ScanForm.Command8.Visible = 0
  ScanForm.Command9.Visible = 0
  ScanForm.Command10.Visible = 0
  ScanForm.Command1.Visible = -1
  ScanForm.Command2.Visible = -1
  ScanForm.Command3.Visible = -1
  ScanForm.Command4.Visible = -1
  ScanForm.Command5.Visible = -1
  ScanForm.Command6.Visible = -1
  ScanForm.Check1.Visible = 0
  ScanForm.Check2.Visible = 0
  ScanForm.Check1.Enabled = -1
  ScanForm.Check2.Enabled = -1
  ScanForm.Picture3.Visible = 0
  ScanForm.Picture4.Visible = 0
  ScanForm.Picture5.Visible = 0
  ScanForm.Picture6.Visible = 0
  ScanForm.Picture1.Visible = -1
  ScanForm.Picture2.Visible = -1
  Karaleah.SaveAsScanMenu.Enabled = -1
  Karaleah.AppendScanMenu.Enabled = -1
  Karaleah.PrintScanMenu.Enabled = -1
  ScanForm.FontTransparent = 0
  CurrentY = 3285
  CurrentX = 6960
  Print "                        "
  CurrentY = 3525
  CurrentX = 6960
  Print "                        "
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  ScanForm.FontTransparent = -1
  ScanForm.Refresh
  ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
  ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
  For Num% = 1 To 120
    Check%(Num%) = 0
  Next
  For Num% = Total% + 121 To Total% + 240
    Check%(Num%) = 0
  Next
  CutSeg$ = "N"
  SelSeg$ = "N"
  Down1$ = "N"
  Down2$ = "N"
  Down3$ = "N"
  Down4$ = "N"

  MinFlux = 100
  MaxFlux = -100
  MinDec = 1000
  MaxDec = -1000
  For Num% = 1 To Total%
    Ra(Num%) = Ra(120 + Num%)
    Dec(Num%) = Dec(120 + Num%)
  Next
  If ScanForm.Check1.Value = 1 And ScanForm.Check2.Value = 1 Then
    For Num% = 1 To Total%
      Flux(Num%) = Flux(120 + Num%) / ((Ra(120 + Num%) - Ra(121)) / (Ra(120 + Total%) - Ra(121)) * (Cal2 - Cal1) + Cal1)
      If Flux(Num%) < MinFlux Then
        MinFlux = Flux(Num%)
      End If
      If Flux(Num%) > MaxFlux Then
        MaxFlux = Flux(Num%)
      End If
      If Dec(Num%) < MinDec Then
        MinDec = Dec(Num%)
      End If
      If Dec(Num%) > MaxDec Then
        MaxDec = Dec(Num%)
      End If
    Next
  ElseIf ScanForm.Check1.Value = 1 Then
    For Num% = 1 To Total%
      Flux(Num%) = Flux(120 + Num%) / Cal1
      If Flux(Num%) < MinFlux Then
        MinFlux = Flux(Num%)
      End If
      If Flux(Num%) > MaxFlux Then
        MaxFlux = Flux(Num%)
      End If
      If Dec(Num%) < MinDec Then
        MinDec = Dec(Num%)
      End If
      If Dec(Num%) > MaxDec Then
        MaxDec = Dec(Num%)
      End If
    Next
  ElseIf ScanForm.Check2.Value = 1 Then
    For Num% = 1 To Total%
      Flux(Num%) = Flux(120 + Num%) / Cal2
      If Flux(Num%) < MinFlux Then
        MinFlux = Flux(Num%)
      End If
      If Flux(Num%) > MaxFlux Then
        MaxFlux = Flux(Num%)
      End If
      If Dec(Num%) < MinDec Then
        MinDec = Dec(Num%)
      End If
      If Dec(Num%) > MaxDec Then
        MaxDec = Dec(Num%)
      End If
    Next
  End If
  If MaxFlux = MinFlux Then
    MaxFlux = MaxFlux + 0.5
    MinFlux = MinFlux - 0.5
  End If
  ScanForm.Check1.Value = 1
  ScanForm.Check2.Value = 1

  For Num% = 1 To Total%
    X = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
    Y = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
    ScanForm.Picture1.Circle (X%, Y%), 15, QBColor(12)
    Y = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
    ScanForm.Picture2.Circle (X%, Y%), 15, QBColor(9)
  Next
  ScanForm.Refresh
  Cal$ = "Y"
End Sub

Private Sub Command8_Click()
  CutSeg$ = "Y"
  If Down1$ <> "Y" Then
    Down1$ = "N"
  End If
  If Down2$ <> "Y" Then
    Down2$ = "N"
  End If

  If SelSeg$ = "Y" And Down3$ = "Y" Then
    ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture5.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture5.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture5.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  End If
  If SelSeg$ = "Y" And Down4$ = "Y" Then
    ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture6.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture6.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture6.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  End If
  SelSeg$ = "N"
  Down3$ = "N"
  Down4$ = "N"
End Sub

Private Sub Command9_Click()
  SelSeg$ = "Y"
  If Down3$ <> "Y" Then
    Down3$ = "N"
  End If
  If Down4$ <> "Y" Then
    Down4$ = "N"
  End If

  If CutSeg$ = "Y" And Down1$ = "Y" Then
    ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture3.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture3.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  If CutSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture4.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture4.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture4.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  End If
  CutSeg$ = "N"
  Down1$ = "N"
  Down2$ = "N"
End Sub

Private Sub Form_Load()
  If LoadData.Caption <> "New Scan" And LoadData.Caption <> "Open Scan" Then
  
  If LoadData.Caption <> "nope" Then

  CurrentY = 810
  CurrentX = 180
  Print "F"
  CurrentX = 210
  Print "l"
  CurrentX = 180
  Print "u"
  CurrentX = 180
  Print "x"
  CurrentY = 2770
  CurrentX = 180
  Print "D"
  CurrentX = 180
  Print "e"
  CurrentX = 180
  Print "c"
  CurrentX = 210
  Print "l"
  CurrentX = 210
  Print "i"
  CurrentX = 180
  Print "n"
  CurrentX = 180
  Print "a"
  CurrentX = 210
  Print "t"
  CurrentX = 210
  Print "i"
  CurrentX = 180
  Print "o"
  CurrentX = 180
  Print "n"
  CurrentY = 2430
  CurrentX = 2760
  Print "Right Ascension"

  If LCase$(Right$(LoadData.File1.filename, 4)) = ".md1" Then
  
  Cal$ = "N"
  Karaleah.NameScanMenu = -1
  Karaleah.AppendScanMenu = 0
  Karaleah.PrintScanMenu = 0
  Karaleah.SaveAsScanMenu = 0
  Karaleah.SaveScanMenu = 0
  Open LoadData.File1.filename For Input As #1
  MinDec = 1000
  MaxDec = -1000
  MinFlux = 100
  MaxFlux = -100
  For Num% = 1 To 60
    Line Input #1, R$
    Line Input #1, Dc$
    Line Input #1, Flx$
    Ra(Num%) = Val(R$)
    Dec(Num%) = Val(Dc$)
    Flux(Num%) = Val(Flx$)
    If Dec(Num%) < MinDec Then
      MinDec = Dec(Num%)
    End If
    If Dec(Num%) > MaxDec Then
      MaxDec = Dec(Num%)
    End If
    If Flux(Num%) < MinFlux Then
      MinFlux = Flux(Num%)
    End If
    If Flux(Num%) > MaxFlux Then
      MaxFlux = Flux(Num%)
    End If
  Next
  Line Input #1, Junk$
  For Num% = 61 To 120
    Line Input #1, R$
    Line Input #1, Dc$
    Line Input #1, Flx$
    Ra(Num%) = Val(R$)
    Dec(Num%) = Val(Dc$)
    Flux(Num%) = Val(Flx$)
    If Dec(Num%) < MinDec Then
      MinDec = Dec(Num%)
    End If
    If Dec(Num%) > MaxDec Then
      MaxDec = Dec(Num%)
    End If
    If Flux(Num%) < MinFlux Then
      MinFlux = Flux(Num%)
    End If
    If Flux(Num%) > MaxFlux Then
      MaxFlux = Flux(Num%)
    End If
  Next
  Line Input #1, Junk$
  Num% = 121
  Line Input #1, R$
  While R$ <> "*"
    Line Input #1, Dc$
    Line Input #1, Flx$
    Ra(Num%) = Val(R$)
    Dec(Num%) = Val(Dc$)
    Flux(Num%) = Val(Flx$)
    If Dec(Num%) < MinDec Then
      MinDec = Dec(Num%)
    End If
    If Dec(Num%) > MaxDec Then
      MaxDec = Dec(Num%)
    End If
    If Flux(Num%) < MinFlux Then
      MinFlux = Flux(Num%)
    End If
    If Flux(Num%) > MaxFlux Then
      MaxFlux = Flux(Num%)
    End If
    Num% = Num% + 1
    Line Input #1, R$
  Wend
  Total% = Num% - 121
  For Num% = Total% + 121 To Total% + 180
    Line Input #1, R$
    Line Input #1, Dc$
    Line Input #1, Flx$
    Ra(Num%) = Val(R$)
    Dec(Num%) = Val(Dc$)
    Flux(Num%) = Val(Flx$)
    If Dec(Num%) < MinDec Then
      MinDec = Dec(Num%)
    End If
    If Dec(Num%) > MaxDec Then
      MaxDec = Dec(Num%)
    End If
    If Flux(Num%) < MinFlux Then
      MinFlux = Flux(Num%)
    End If
    If Flux(Num%) > MaxFlux Then
      MaxFlux = Flux(Num%)
    End If
  Next
  Line Input #1, Junk$
  For Num% = Total% + 181 To Total% + 240
    Line Input #1, R$
    Line Input #1, Dc$
    Line Input #1, Flx$
    Ra(Num%) = Val(R$)
    Dec(Num%) = Val(Dc$)
    Flux(Num%) = Val(Flx$)
    If Dec(Num%) < MinDec Then
      MinDec = Dec(Num%)
    End If
    If Dec(Num%) > MaxDec Then
      MaxDec = Dec(Num%)
    End If
    If Flux(Num%) < MinFlux Then
      MinFlux = Flux(Num%)
    End If
    If Flux(Num%) > MaxFlux Then
      MaxFlux = Flux(Num%)
    End If
  Next
  Close #1
  If Ra(Total%) < Ra(1) Then
    Num% = Total%
    While Ra(Num%) > Ra(Num% - 1)
      Ra(Num%) = Ra(Num%) + 24
      Num% = Num% - 1
    Wend
    Ra(Num%) = Ra(Num%) + 24
  End If
  If MaxDec = MinDec Then
    MaxDec = MaxDec + 0.5
    MinDec = MinDec - 0.5
  End If
  If MaxFlux = MinFlux Then
    MaxFlux = MaxFlux + 0.5
    MinFlux = MinFlux - 0.5
  End If
  Length% = Len(LoadData.File1.filename)
  ScanForm.Caption = UCase$(Left$(LoadData.File1.filename, Length% - 4))
  Show
  ScanForm.Refresh
  X = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(Total% + 240) - Ra(1)) * 5955
  ScanForm.Picture1.Line (X, 0)-(X, 2145), QBColor(8)
  ScanForm.Picture2.Line (X, 0)-(X, 2145), QBColor(8)
  X = ((Ra(120) + Ra(121)) / 2 - Ra(1)) / (Ra(Total% + 240) - Ra(1)) * 5955
  ScanForm.Picture1.Line (X, 0)-(X, 2145), QBColor(8)
  ScanForm.Picture2.Line (X, 0)-(X, 2145), QBColor(8)
  X = ((Ra(Total% + 120) + Ra(Total% + 121)) / 2 - Ra(1)) / (Ra(Total% + 240) - Ra(1)) * 5955
  ScanForm.Picture1.Line (X, 0)-(X, 2145), QBColor(8)
  ScanForm.Picture2.Line (X, 0)-(X, 2145), QBColor(8)
  X = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(1)) / (Ra(Total% + 240) - Ra(1)) * 5955
  ScanForm.Picture1.Line (X, 0)-(X, 2145), QBColor(8)
  ScanForm.Picture2.Line (X, 0)-(X, 2145), QBColor(8)
  For Num% = 1 To Total% + 240
    X = (Ra(Num%) - Ra(1)) / (Ra(Total% + 240) - Ra(1)) * 5955
    Y = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
    ScanForm.Picture1.Circle (X%, Y%), 15, QBColor(12)
    Y = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
    ScanForm.Picture2.Circle (X%, Y%), 15, QBColor(9)
  Next
  ScanForm.Refresh
  For Num% = 1 To 120
    Check%(Num%) = 0
  Next
  For Num% = Total% + 121 To Total% + 240
    Check%(Num%) = 0
  Next

  Else
  
  Cal$ = "Y"
  Karaleah.NameScanMenu = -1
  Karaleah.AppendScanMenu = -1
  Karaleah.PrintScanMenu = -1
  Karaleah.SaveAsScanMenu = -1
  Karaleah.SaveScanMenu = -1
  Open LoadData.File1.filename For Input As #1
    Line Input #1, Junk$
    ScanForm.Caption = Junk$
    Line Input #1, Junk$
    ScanForm.Command1.Enabled = 0
    ScanForm.Command5.Enabled = -1
    If Junk$ = "A" Then
      ScanForm.Command2.Enabled = -1
    Else
      ScanForm.Command3.Enabled = -1
      ScanForm.Command4.Enabled = -1
    End If
    Line Input #1, Peak$
    Line Input #1, Junk$
    MinDec = Val(Junk$)
    Line Input #1, Junk$
    MaxDec = Val(Junk$)
    Line Input #1, Junk$
    MinFlux = Val(Junk$)
    Line Input #1, Junk$
    MaxFlux = Val(Junk$)
    Line Input #1, Junk$
    Total% = Val(Junk$)
    For Num% = 1 To Total%
      Line Input #1, Junk$
      Check%(Num%) = Val(Junk$)
      Line Input #1, Junk$
      Ra(Num%) = Val(Junk$)
      Line Input #1, Junk$
      Dec(Num%) = Val(Junk$)
      Line Input #1, Junk$
      Flux(Num%) = Val(Junk$)
    Next
  Close #1
  If Ra(Total%) < Ra(1) Then
    Num% = Total%
    While Ra(Num%) > Ra(Num% - 1)
      Ra(Num%) = Ra(Num%) + 24
      Num% = Num% - 1
    Wend
    Ra(Num%) = Ra(Num%) + 24
  End If
  Show
  ScanForm.Refresh
  For Num% = 1 To Total%
    X = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
    'If (Flux(num%) >= MinFlux) And (Flux(num%) <= MaxFlux) Then
      Y = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
    'End If
    If Check%(Num%) = -1 Then
      ScanForm.Picture1.PSet (X%, Y%), QBColor(7)
      Y = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
      ScanForm.Picture2.PSet (X%, Y%), QBColor(7)
    Else
      ScanForm.Picture1.Circle (X%, Y%), 15, QBColor(12)
      Y = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
      ScanForm.Picture2.Circle (X%, Y%), 15, QBColor(9)
    End If
    'Scanform.Refresh
  Next
  ScanForm.Label1.Caption = Peak$
  ScanForm.Refresh

  End If
  CutSeg$ = "N"
  SelSeg$ = "N"
  BaseSeg$ = "N"
  PeakSeg$ = "N"

  End If

  End If
End Sub

Private Sub Label1_Change()
  If ScanForm.Label1.Caption = "" Then
    ScanForm.Label3.Caption = ""
  ElseIf DataForm.CalSlope <> "" Then
    Length% = Len(DataForm.CalSlope.Caption)
    Slope = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    Length% = Len(ScanForm.Label1.Caption)
    Pk = Val(Right$(ScanForm.Label1.Caption, Length% - 11)) * Slope
    If Abs(Pk) < 0.5 Then
      Pkk$ = "Peak Flux: 0 Jy"
    Else
      If Pk < 0 Then
        Pkk$ = "Peak Flux: -"
      Else
        Pkk$ = "Peak Flux: "
      End If
      Pkk$ = Pkk$ + Format$(Abs(Pk), "#") + " Jy"
    End If
    ScanForm.Label3.Caption = Pkk$
  Else
    ScanForm.Label3.Caption = ScanForm.Label1.Caption
  End If
  ScanForm.FontTransparent = 0
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                                "
  ScanForm.FontTransparent = -1
  ScanForm.Refresh
End Sub

Private Sub Picture1_GotFocus()
  If LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Then
    Open LoadData.Text1.Text For Output As #1
    Print #1, ScanForm.Caption
    If ScanForm.Command2.Enabled = -1 Then
      Print #1, "A"
    Else
      Print #1, "B"
    End If
    Print #1, Peak$
    Print #1, MinDec
    Print #1, MaxDec
    Print #1, Format$(MinFlux, "#.####")
    Print #1, Format$(MaxFlux, "#.####")
    Print #1, Total%
    For Num% = 1 To Total%
      Print #1, Check%(Num%)
      Print #1, Ra(Num%)
      Print #1, Dec(Num%)
      Print #1, Format$(Flux(Num%), "#.####")
    Next
    Close #1
    If LoadData.Caption = "save" Then
      ScanForm.Label2.Caption = LoadData.Label4.Caption + "\" + LoadData.Text1.Text
    End If
    Karaleah.SaveScanMenu.Enabled = -1
  End If
  If LoadData.Caption <> "show" Then
    Unload LoadData
  End If
End Sub

Private Sub Picture1_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down1$ = "N" And Button = 1 Then
    Down1$ = "Y"
    XBeg% = X
  ElseIf BaseSeg$ = "Y" And Down2$ = "N" And Button = 1 Then
    Down2$ = "Y"
    XBeg% = X
    YBeg% = Y
  ElseIf PeakSeg$ = "Y" And Button = 1 Then
    PeakSeg$ = "N"
    Y = (2130 - Y) / 2130 * (MaxFlux - MinFlux) + MinFlux
    If Abs(Y) < 0.0005 Then
      Peak$ = "Peak Flux: 0"
    Else
      If Y < 0 Then
        Peak$ = "Peak Flux: -"
      Else
        Peak$ = "Peak Flux: "
      End If
      Peak$ = Peak$ + Format$(Abs(Y), "#.###")
    End If
    ScanForm.Label1.Caption = Peak$
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf CutSeg$ = "Y" And Down1$ = "Y" And Button = 2 Then
    Down1$ = "N"
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf BaseSeg$ = "Y" And Down2$ = "Y" And Button = 2 Then
    Down2$ = "N"
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf PeakSeg$ = "Y" And Button = 2 Then
    PeakSeg$ = "N"
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf CutSeg$ = "Y" And Down1$ = "Y" And Button = 1 Then
    MinMem = MinFlux
    MaxMem = MaxFlux
    MinFlux = 100
    MaxFlux = -100
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      If Abs(XTemp% - XBeg%) <= Abs(X - XBeg%) And Abs(XTemp% - X) <= Abs(X - XBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux(Num%) < MinFlux Then
          MinFlux = Flux(Num%)
        End If
        If Flux(Num%) > MaxFlux Then
          MaxFlux = Flux(Num%)
        End If
      End If
    Next
    If MinFlux = 100 Or MaxFlux = -100 Or MinFlux = MaxFlux Then
      MinFlux = MinMem
      MaxFlux = MaxMem
    End If
    Down1$ = "N"
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture2.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  ElseIf BaseSeg$ = "Y" And Down2$ = "Y" And Button = 1 Then
    XPlus = X / 5955 * (Ra(Total%) - Ra(1)) + Ra(1)
    YPlus = (2130 - Y) / 2130 * (MaxFlux - MinFlux) + MinFlux
    X = (X - XBeg%) / 5955 * (Ra(Total%) - Ra(1))
    Y = (YBeg% - Y) / 2130 * (MaxFlux - MinFlux)
    If X <> 0 Then

    B = YPlus - Y / X * (XPlus - Ra(1))
    MinMem = MinFlux
    MaxMem = MaxFlux
    MinFlux = 100
    MaxFlux = -100
    For Num% = 1 To Total%
      Flux(Num%) = Flux(Num%) - Y / X * (Ra(Num%) - Ra(1)) - B
      If Check%(Num%) <> -1 Then
        If Flux(Num%) < MinFlux Then
          MinFlux = Flux(Num%)
        End If
        If Flux(Num%) > MaxFlux Then
          MaxFlux = Flux(Num%)
        End If
      End If
    Next
    If MinFlux = 100 Or MaxFlux = -100 Then
      MinFlux = MinMem
      MaxFlux = MaxMem
    ElseIf MinFlux = MaxFlux Then
      MinFlux = MinFlux - 0.5
      MaxFlux = MaxFlux + 0.5
    End If
    BaseSeg$ = "N"
    Down2$ = "N"
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    Peak$ = ""
    ScanForm.Label1.Caption = Peak$
    ScanForm.Refresh

    End If
  End If
End Sub

Private Sub Picture1_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down1$ = "Y" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                "
    ScanForm.FontTransparent = -1
    ScanForm.Refresh
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture1.Line (XBeg%, 0)-(X, 2130), QBColor(10), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf BaseSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                "
    ScanForm.FontTransparent = -1
    ScanForm.Refresh
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture1.Line (XBeg%, YBeg%)-(X, Y), QBColor(13)
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf PeakSeg$ = "Y" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                "
    ScanForm.FontTransparent = -1
    ScanForm.Refresh
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture1.Line (0, Y)-(5955, Y), QBColor(11)
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  Else
  
  If Cal$ <> "Y" Then
    X = X / 5955 * (Ra(Total% + 240) - Ra(1)) + Ra(1)
  Else
    X = X / 5955 * (Ra(Total%) - Ra(1)) + Ra(1)
  End If
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  ScanForm.FontTransparent = 0
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                                "
  ScanForm.FontTransparent = -1
  CurrentY = 4200
  CurrentX = 6720
  Print "RA: ";
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  ElseIf Hrs% >= 24 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs% - 24;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Num% = 1
  While Ra(Num%) < X
    Num% = Num% + 1
  Wend
  Hrs% = Int(Abs(Dec(Num%)))
  Mins% = Int((Abs(Dec(Num%)) - Hrs%) * 60)
  Secs% = Int((Abs(Dec(Num%)) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If Dec(Num%) < 0 Then
    Print "-";
  End If
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Y = (2130 - Y) / 2130 * (MaxFlux - MinFlux) + MinFlux
  If Cal$ = "Y" And DataForm.CalSlope.Caption <> "" Then
    Length% = Len(DataForm.CalSlope.Caption)
    Y = Y * Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
  End If
  CurrentX = 6720
  Print "Flux: ";
  If Abs(Y) < 0.0005 Then
    Print "0";
  Else
    If Y < 0 Then
      Print "-";
    End If
    Print Format$(Abs(Y), "#.###");
  End If
  If Cal$ <> "Y" Then
    Print " V"
  ElseIf Cal$ = "Y" And DataForm.CalSlope.Caption <> "" Then
    Print " Jy"
  End If
  ScanForm.Refresh

  End If
End Sub

Private Sub Picture2_GotFocus()
  If LoadData.Caption = "show" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    ScanForm.FontTransparent = -1
    Karaleah.NameScanMenu = -1
    Karaleah.AppendScanMenu = -1
    Karaleah.SaveAsScanMenu = -1
    Karaleah.SaveScanMenu = 0
    ScanForm.Label2.Caption = ""
    Open LoadData.File1.filename For Input As #1
    Line Input #1, Junk$
    ScanForm.Caption = ScanForm.Caption + " - " + Junk$
    Line Input #1, Junk$
    ScanForm.Command1.Enabled = 0
    ScanForm.Command2.Enabled = -1
    ScanForm.Command3.Enabled = 0
    ScanForm.Command4.Enabled = 0
    ScanForm.Command5.Enabled = -1
    Line Input #1, Peak$
    ScanForm.Label1.Caption = ""
    ScanForm.Refresh
    Line Input #1, Junk$
    If Val(Junk$) < MinDec Then
      MinDec = Val(Junk$)
    End If
    Line Input #1, Junk$
    If Val(Junk$) > MaxDec Then
      MaxDec = Val(Junk$)
    End If
    Line Input #1, Junk$
    If Val(Junk$) < MinFlux Then
      MinFlux = Val(Junk$)
    End If
    Line Input #1, Junk$
    If Val(Junk$) > MaxFlux Then
      MaxFlux = Val(Junk$)
    End If
    Line Input #1, Junk$
    Total% = Total% + Val(Junk$)
    For Num% = Total% - Val(Junk$) + 1 To Total%
      Line Input #1, Junk$
      Check%(Num%) = Val(Junk$)
      Line Input #1, Junk$
      Ra(Num%) = Val(Junk$)
      Line Input #1, Junk$
      Dec(Num%) = Val(Junk$)
      Line Input #1, Junk$
      Flux(Num%) = Val(Junk$)
    Next
    Close #1
    If Ra(Total%) < Ra(Total% - Val(Junk$) + 1) Then
      Num% = Total%
      While Ra(Num%) > Ra(Num% - 1)
        Ra(Num%) = Ra(Num%) + 24
        Num% = Num% - 1
      Wend
      Ra(Num%) = Ra(Num%) + 24
    End If
    For Cnt% = 1 To Total% - 1
      For Num% = 1 To Total% - 1
        If Ra(Num% + 1) < Ra(Num%) Then
          CheckTemp% = Check%(Num%)
          RaTemp = Ra(Num%)
          DecTemp = Dec(Num%)
          FluxTemp = Flux(Num%)
          Check%(Num%) = Check%(Num% + 1)
          Ra(Num%) = Ra(Num% + 1)
          Dec(Num%) = Dec(Num% + 1)
          Flux(Num%) = Flux(Num% + 1)
          Check%(Num% + 1) = CheckTemp%
          Ra(Num% + 1) = RaTemp
          Dec(Num% + 1) = DecTemp
          Flux(Num% + 1) = FluxTemp
        End If
      Next
    Next
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture2.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      X = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      Y = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture1.PSet (X%, Y%), QBColor(7)
        Y = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.PSet (X%, Y%), QBColor(7)
      Else
        ScanForm.Picture1.Circle (X%, Y%), 15, QBColor(12)
        Y = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.Circle (X%, Y%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
    CutSeg$ = "N"
    SelSeg$ = "N"
    BaseSeg$ = "N"
    PeakSeg$ = "N"
  End If
  If LoadData.Caption <> "save" Then
    Unload LoadData
  End If
End Sub

Private Sub Picture2_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down2$ = "N" And Button = 1 Then
    Down2$ = "Y"
    YBeg% = Y
  ElseIf SelSeg$ = "Y" And Down2$ = "Y" And Button = 2 Then
    Down2$ = "N"
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture2.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  ElseIf SelSeg$ = "Y" And Down2$ = "Y" And Button = 1 Then
    ScanForm.Command2.Enabled = 0
    ScanForm.Command3.Enabled = -1
    ScanForm.Command4.Enabled = -1
    ScanForm.Refresh
    MinMem = MinFlux
    MaxMem = MaxFlux
    MinFlux = 100
    MaxFlux = -100
    For Num% = 1 To Total%
      YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
      If (YTemp% > Y And Y >= YBeg%) Or (YTemp% < YBeg% And Y >= YBeg%) Or (YTemp% < Y And Y <= YBeg%) Or (YTemp% > YBeg% And Y <= YBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux(Num%) < MinFlux Then
          MinFlux = Flux(Num%)
        End If
        If Flux(Num%) > MaxFlux Then
          MaxFlux = Flux(Num%)
        End If
      End If
    Next
    If MinFlux = 100 Or MaxFlux = -100 Or MinFlux = MaxFlux Then
      MinFlux = MinMem
      MaxFlux = MaxMem
    End If
    SelSeg$ = "N"
    Down2$ = "N"
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture2.Line (0, 0)-(5955, 2130), QBColor(15), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
        ScanForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  End If
End Sub

Private Sub Picture2_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                "
    ScanForm.FontTransparent = -1
    ScanForm.Refresh
    ScanForm.Picture1.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture2.Line (0, 0)-(5955, 2130), QBColor(15), BF
    ScanForm.Picture2.Line (0, YBeg%)-(5955, Y), QBColor(14), BF
    For Num% = 1 To Total%
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(Total%) - Ra(1)) * 5955
      YTemp% = 2130 - (Dec(Num%) - MinDec) / (MaxDec - MinDec) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture2.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
      YTmp = 2130 - (Flux(Num%) - MinFlux) / (MaxFlux - MinFlux) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(7)
        End If
      ElseIf (YTemp% > Y And Y >= YBeg%) Or (YTemp% < YBeg% And Y >= YBeg%) Or (YTemp% < Y And Y <= YBeg%) Or (YTemp% > YBeg% And Y <= YBeg%) Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.PSet (XTemp%, YTemp%), QBColor(12)
        End If
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture1.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  Else
  
  If Cal$ <> "Y" Then
    X = X / 5955 * (Ra(Total% + 240) - Ra(1)) + Ra(1)
  Else
    X = X / 5955 * (Ra(Total%) - Ra(1)) + Ra(1)
  End If
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  ScanForm.FontTransparent = 0
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                                "
  ScanForm.FontTransparent = -1
  CurrentY = 4200
  CurrentX = 6720
  Print "RA: ";
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  ElseIf Hrs% >= 24 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs% - 24;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Y = (2130 - Y) / 2130 * (MaxDec - MinDec) + MinDec
  Hrs% = Int(Abs(Y))
  Mins% = Int((Abs(Y) - Hrs%) * 60)
  Secs% = Int((Abs(Y) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If Y < 0 Then
    Print "-";
  End If
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  CurrentX = 6720
  Num% = 1
  While Ra(Num%) < X
    Num% = Num% + 1
  Wend
  Y = Flux(Num%)
  If Cal$ = "Y" And DataForm.CalSlope.Caption <> "" Then
    Length% = Len(DataForm.CalSlope.Caption)
    Y = Flux(Num%) * Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
  End If
  Print "Flux: ";
  If Abs(Y) < 0.0005 Then
    Print "0";
  Else
    If Y < 0 Then
      Print "-";
    End If
    Print Format$(Abs(Y), "#.###");
  End If
  If Cal$ <> "Y" Then
    Print " V"
  ElseIf Cal$ = "Y" And DataForm.CalSlope.Caption <> "" Then
    Print " Jy"
  End If
  ScanForm.Refresh
  
  End If
End Sub

Private Sub Picture3_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down1$ = "N" And Button = 1 Then
    Down1$ = "Y"
    XBeg% = X
    Down2$ = "N"
    ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture4.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture4.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture4.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf Down1$ = "Y" And Button = 2 Then
    Down1$ = "N"
    ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture3.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture3.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf CutSeg$ = "Y" And Down1$ = "Y" And Button = 1 Then
    MinMem = MinFlux1
    MaxMem = MaxFlux1
    MinFlux1 = 100
    MaxFlux1 = -100
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      If Abs(XTemp% - XBeg%) <= Abs(X - XBeg%) And Abs(XTemp% - X) <= Abs(X - XBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux(Num%) < MinFlux1 Then
          MinFlux1 = Flux(Num%)
        End If
        If Flux(Num%) > MaxFlux1 Then
          MaxFlux1 = Flux(Num%)
        End If
      End If
    Next
    If MinFlux1 = 100 Or MaxFlux1 = -100 Or MinFlux1 = MaxFlux1 Then
      MinFlux1 = MinMem
      MaxFlux1 = MaxMem
    End If
    Down1$ = "N"
    ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
    ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture3.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    ScanForm.Picture5.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture3.PSet (XTemp%, YTemp%), QBColor(7)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
        ScanForm.Picture5.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
        ScanForm.Picture5.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh

    CalA = 0
    CalB = 0
    Tot1% = 0
    Tot2% = 0
    For Num% = 1 To 60
      If Check%(Num%) <> -1 Then
        CalA = CalA + Flux(Num%)
        Tot1% = Tot1% + 1
      End If
    Next
    For Num% = 61 To 120
      If Check%(Num%) <> -1 Then
        CalB = CalB + Flux(Num%)
        Tot2% = Tot2% + 1
      End If
    Next
    ScanForm.FontTransparent = 0
    CurrentY = 3285
    CurrentX = 6960
    Print "                        "
    ScanForm.FontTransparent = -1
    CurrentY = 3285
    CurrentX = 6960
    If Tot1% > 0 And Tot2% > 0 Then
      CalA = CalA / Tot1%
      CalB = CalB / Tot2%
      Cal1 = CalA - CalB
      Print "Initial: "; Format$(Cal1, "#.###"); " V"
    Else
      Print "Initial"
      ScanForm.Check1.Value = 0
      ScanForm.Check1.Enabled = 0
      If ScanForm.Check1.Value = 0 And ScanForm.Check2.Value = 0 Then
        ScanForm.Command7.Enabled = 0
      End If
    End If
    ScanForm.Refresh
  End If
End Sub

Private Sub Picture3_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down1$ = "Y" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    ScanForm.FontTransparent = -1
    ScanForm.Refresh
    ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
    ScanForm.Picture3.Line (XBeg%, 0)-(X, 2130), QBColor(10), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture3.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture3.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  Else
  
  X = X / 2850 * (Ra(120) - Ra(1)) + Ra(1)
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  ScanForm.FontTransparent = 0
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  ScanForm.FontTransparent = -1
  CurrentY = 4200
  CurrentX = 6720
  Print "RA: ";
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  ElseIf Hrs% >= 24 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs% - 24;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Num% = 1
  While Ra(Num%) < X
    Num% = Num% + 1
  Wend
  Hrs% = Int(Abs(Dec(Num%)))
  Mins% = Int((Abs(Dec(Num%)) - Hrs%) * 60)
  Secs% = Int((Abs(Dec(Num%)) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If Dec(Num%) < 0 Then
    Print "-";
  End If
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Y = (2130 - Y) / 2130 * (MaxFlux1 - MinFlux1) + MinFlux1
  CurrentX = 6720
  Print "Flux: ";
  If Abs(Y) < 0.0005 Then
    Print "0";
  Else
    If Y < 0 Then
      Print "-";
    End If
    Print Format$(Abs(Y), "#.###"); " V"
  End If
  ScanForm.Refresh

  End If
End Sub

Private Sub Picture4_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down2$ = "N" And Button = 1 Then
    Down2$ = "Y"
    XBeg% = X
    Down1$ = "N"
    ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture3.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture3.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf Down2$ = "Y" And Button = 2 Then
    Down2$ = "N"
    ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture4.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture4.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture4.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  ElseIf CutSeg$ = "Y" And Down2$ = "Y" And Button = 1 Then
    MinMem = MinFlux2
    MaxMem = MaxFlux2
    MinFlux2 = 100
    MaxFlux2 = -100
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      If Abs(XTemp% - XBeg%) <= Abs(X - XBeg%) And Abs(XTemp% - X) <= Abs(X - XBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux(Num%) < MinFlux2 Then
          MinFlux2 = Flux(Num%)
        End If
        If Flux(Num%) > MaxFlux2 Then
          MaxFlux2 = Flux(Num%)
        End If
      End If
    Next
    If MinFlux2 = 100 Or MaxFlux2 = -100 Or MinFlux2 = MaxFlux2 Then
      MinFlux2 = MinMem
      MaxFlux2 = MaxMem
    End If
    Down2$ = "N"
    ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
    ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture4.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    ScanForm.Picture6.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture4.PSet (XTemp%, YTemp%), QBColor(7)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
        ScanForm.Picture6.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture4.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
        ScanForm.Picture6.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh

    CalA = 0
    CalB = 0
    Tot1% = 0
    Tot2% = 0
    For Num% = Total% + 121 To Total% + 180
      If Check%(Num%) <> -1 Then
        CalA = CalA + Flux(Num%)
        Tot1% = Tot1% + 1
      End If
    Next
    For Num% = Total% + 181 To Total% + 240
      If Check%(Num%) <> -1 Then
        CalB = CalB + Flux(Num%)
        Tot2% = Tot2% + 1
      End If
    Next
    ScanForm.FontTransparent = 0
    CurrentY = 3525
    CurrentX = 6960
    Print "                        "
    ScanForm.FontTransparent = -1
    CurrentY = 3525
    CurrentX = 6960
    If Tot1% > 0 And Tot2% > 0 Then
      CalA = CalA / Tot1%
      CalB = CalB / Tot2%
      Cal2 = CalA - CalB
      Print "Terminal: "; Format$(Cal2, "#.###"); " V"
    Else
      Print "Terminal"
      ScanForm.Check2.Value = 0
      ScanForm.Check2.Enabled = 0
      If ScanForm.Check1.Value = 0 And ScanForm.Check2.Value = 0 Then
        ScanForm.Command7.Enabled = 0
      End If
    End If
    ScanForm.Refresh
  End If
End Sub

Private Sub Picture4_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down2$ = "Y" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    ScanForm.FontTransparent = -1
    ScanForm.Refresh
    ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
    ScanForm.Picture4.Line (XBeg%, 0)-(X, 2130), QBColor(10), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture4.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          ScanForm.Picture4.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          ScanForm.Picture4.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    ScanForm.Refresh
  Else
  
  X = X / 2850 * (Ra(Total% + 240) - Ra(Total% + 121)) + Ra(Total% + 121)
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  ScanForm.FontTransparent = 0
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  ScanForm.FontTransparent = -1
  CurrentY = 4200
  CurrentX = 6720
  Print "RA: ";
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  ElseIf Hrs% >= 24 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs% - 24;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Num% = Total% + 121
  While Ra(Num%) < X
    Num% = Num% + 1
  Wend
  Hrs% = Int(Abs(Dec(Num%)))
  Mins% = Int((Abs(Dec(Num%)) - Hrs%) * 60)
  Secs% = Int((Abs(Dec(Num%)) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If Dec(Num%) < 0 Then
    Print "-";
  End If
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Y = (2130 - Y) / 2130 * (MaxFlux2 - MinFlux2) + MinFlux2
  CurrentX = 6720
  Print "Flux: ";
  If Abs(Y) < 0.0005 Then
    Print "0";
  Else
    If Y < 0 Then
      Print "-";
    End If
    Print Format$(Abs(Y), "#.###"); " V"
  End If
  ScanForm.Refresh

  End If
End Sub

Private Sub Picture5_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down3$ = "N" And Button = 1 Then
    Down3$ = "Y"
    YBeg% = Y
    Down4$ = "N"
    ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture6.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture6.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture6.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  ElseIf Down3$ = "Y" And Button = 2 Then
    Down3$ = "N"
    ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture5.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture5.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture5.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  ElseIf SelSeg$ = "Y" And Down3$ = "Y" And Button = 1 Then
    MinMem = MinFlux1
    MaxMem = MaxFlux1
    MinFlux1 = 100
    MaxFlux1 = -100
    For Num% = 1 To 120
      YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If (YTemp% > Y And Y >= YBeg%) Or (YTemp% < YBeg% And Y >= YBeg%) Or (YTemp% < Y And Y <= YBeg%) Or (YTemp% > YBeg% And Y <= YBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux(Num%) < MinFlux1 Then
          MinFlux1 = Flux(Num%)
        End If
        If Flux(Num%) > MaxFlux1 Then
          MaxFlux1 = Flux(Num%)
        End If
      End If
    Next
    If MinFlux1 = 100 Or MaxFlux1 = -100 Or MinFlux1 = MaxFlux1 Then
      MinFlux1 = MinMem
      MaxFlux1 = MaxMem
    End If
    Down3$ = "N"
    ScanForm.Picture3.Line (0, 0)-(2850, 2130), QBColor(15), BF
    ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture3.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    ScanForm.Picture5.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture3.PSet (XTemp%, YTemp%), QBColor(7)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
        ScanForm.Picture5.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
        ScanForm.Picture5.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh

    CalA = 0
    CalB = 0
    Tot1% = 0
    Tot2% = 0
    For Num% = 1 To 60
      If Check%(Num%) <> -1 Then
        CalA = CalA + Flux(Num%)
        Tot1% = Tot1% + 1
      End If
    Next
    For Num% = 61 To 120
      If Check%(Num%) <> -1 Then
        CalB = CalB + Flux(Num%)
        Tot2% = Tot2% + 1
      End If
    Next
    ScanForm.FontTransparent = 0
    CurrentY = 3285
    CurrentX = 6960
    Print "                        "
    ScanForm.FontTransparent = -1
    CurrentY = 3285
    CurrentX = 6960
    If Tot1% > 0 And Tot2% > 0 Then
      CalA = CalA / Tot1%
      CalB = CalB / Tot2%
      Cal1 = CalA - CalB
      Print "Initial: "; Format$(Cal1, "#.###"); " V"
    Else
      Print "Initial"
      ScanForm.Check1.Value = 0
      ScanForm.Check1.Enabled = 0
      If ScanForm.Check1.Value = 0 And ScanForm.Check2.Value = 0 Then
        ScanForm.Command7.Enabled = 0
      End If
    End If
    ScanForm.Refresh
  End If
End Sub

Private Sub Picture5_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down3$ = "Y" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    ScanForm.FontTransparent = -1
    ScanForm.Refresh
    ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
    ScanForm.Picture5.Line (0, YBeg%)-(2850, Y), QBColor(14), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture5.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture5.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture5.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  Else
  
  X = X / 2850 * (Ra(120) - Ra(1)) + Ra(1)
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  ScanForm.FontTransparent = 0
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  ScanForm.FontTransparent = -1
  CurrentY = 4200
  CurrentX = 6720
  Print "RA: ";
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  ElseIf Hrs% >= 24 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs% - 24;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Y = (2130 - Y) / 2130 * (MaxDec1 - MinDec1) + MinDec1
  Hrs% = Int(Abs(Y))
  Mins% = Int((Abs(Y) - Hrs%) * 60)
  Secs% = Int((Abs(Y) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If Y < 0 Then
    Print "-";
  End If
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  CurrentX = 6720
  Num% = 1
  While Ra(Num%) < X
    Num% = Num% + 1
  Wend
  Print "Flux: ";
  If Abs(Flux(Num%)) < 0.0005 Then
    Print "0";
  Else
    If Flux(Num%) < 0 Then
      Print "-";
    End If
    Print Format$(Abs(Flux(Num%)), "#.###"); " V"
  End If
  ScanForm.Refresh

  End If
End Sub

Private Sub Picture6_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down4$ = "N" And Button = 1 Then
    Down4$ = "Y"
    YBeg% = Y
    Down3$ = "N"
    ScanForm.Picture5.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(60) + Ra(61)) / 2 - Ra(1)) / (Ra(120) - Ra(1)) * 2850
    ScanForm.Picture5.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra(Num%) - Ra(1)) / (Ra(120) - Ra(1)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture5.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture5.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  ElseIf Down4$ = "Y" And Button = 2 Then
    Down4$ = "N"
    ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture6.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture6.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture6.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  ElseIf SelSeg$ = "Y" And Down4$ = "Y" And Button = 1 Then
    MinMem = MinFlux2
    MaxMem = MaxFlux2
    MinFlux2 = 100
    MaxFlux2 = -100
    For Num% = Total% + 121 To Total% + 240
      YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If (YTemp% > Y And Y >= YBeg%) Or (YTemp% < YBeg% And Y >= YBeg%) Or (YTemp% < Y And Y <= YBeg%) Or (YTemp% > YBeg% And Y <= YBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux(Num%) < MinFlux2 Then
          MinFlux2 = Flux(Num%)
        End If
        If Flux(Num%) > MaxFlux2 Then
          MaxFlux2 = Flux(Num%)
        End If
      End If
    Next
    If MinFlux2 = 100 Or MaxFlux2 = -100 Or MinFlux2 = MaxFlux2 Then
      MinFlux2 = MinMem
      MaxFlux2 = MaxMem
    End If
    Down4$ = "N"
    ScanForm.Picture4.Line (0, 0)-(2850, 2130), QBColor(15), BF
    ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture4.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    ScanForm.Picture6.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTmp = 2130 - (Flux(Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If Check%(Num%) = -1 Then
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture4.PSet (XTemp%, YTemp%), QBColor(7)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
        ScanForm.Picture6.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        If YTmp >= 0 And YTmp <= 2130 Then
          YTemp% = YTmp
          ScanForm.Picture4.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
        YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
        ScanForm.Picture6.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh

    CalA = 0
    CalB = 0
    Tot1% = 0
    Tot2% = 0
    For Num% = Total% + 121 To Total% + 180
      If Check%(Num%) <> -1 Then
        CalA = CalA + Flux(Num%)
        Tot1% = Tot1% + 1
      End If
    Next
    For Num% = Total% + 181 To Total% + 240
      If Check%(Num%) <> -1 Then
        CalB = CalB + Flux(Num%)
        Tot2% = Tot2% + 1
      End If
    Next
    ScanForm.FontTransparent = 0
    CurrentY = 3525
    CurrentX = 6960
    Print "                        "
    ScanForm.FontTransparent = -1
    CurrentY = 3525
    CurrentX = 6960
    If Tot1% > 0 And Tot2% > 0 Then
      CalA = CalA / Tot1%
      CalB = CalB / Tot2%
      Cal2 = CalA - CalB
      Print "Terminal: "; Format$(Cal2, "#.###"); " V"
    Else
      Print "Terminal"
      ScanForm.Check2.Value = 0
      ScanForm.Check2.Enabled = 0
      If ScanForm.Check1.Value = 0 And ScanForm.Check2.Value = 0 Then
        ScanForm.Command7.Enabled = 0
      End If
    End If
    ScanForm.Refresh
  End If
End Sub

Private Sub Picture6_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down4$ = "Y" Then
    ScanForm.FontTransparent = 0
    CurrentY = 4200
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    ScanForm.FontTransparent = -1
    ScanForm.Refresh
    ScanForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    ScanForm.Picture6.Line (0, YBeg%)-(2850, Y), QBColor(14), BF
    XTemp% = ((Ra(Total% + 180) + Ra(Total% + 181)) / 2 - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
    ScanForm.Picture6.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = Total% + 121 To Total% + 240
      XTemp% = (Ra(Num%) - Ra(Total% + 121)) / (Ra(Total% + 240) - Ra(Total% + 121)) * 2850
      YTemp% = 2130 - (Dec(Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        ScanForm.Picture6.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        ScanForm.Picture6.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    ScanForm.Refresh
  Else
  
  X = X / 2850 * (Ra(Total% + 240) - Ra(Total% + 121)) + Ra(Total% + 121)
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  ScanForm.FontTransparent = 0
  CurrentY = 4200
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  ScanForm.FontTransparent = -1
  CurrentY = 4200
  CurrentX = 6720
  Print "RA: ";
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  ElseIf Hrs% >= 24 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs% - 24;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  Y = (2130 - Y) / 2130 * (MaxDec2 - MinDec2) + MinDec2
  Hrs% = Int(Abs(Y))
  Mins% = Int((Abs(Y) - Hrs%) * 60)
  Secs% = Int((Abs(Y) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If Y < 0 Then
    Print "-";
  End If
  If Hrs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Hrs%;
  Else
    CurrentX = CurrentX - 60
    Print Hrs%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Mins% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Mins%;
  Else
    CurrentX = CurrentX - 60
    Print Mins%;
  End If
  CurrentX = CurrentX - 60
  Print ":";
  If Secs% < 10 Then
    CurrentX = CurrentX - 10
    Print "0";
    CurrentX = CurrentX - 60
    Print Secs%
  Else
    CurrentX = CurrentX - 60
    Print Secs%
  End If
  CurrentX = 6720
  Num% = Total% + 121
  While Ra(Num%) < X
    Num% = Num% + 1
  Wend
  Print "Flux: ";
  If Abs(Flux(Num%)) < 0.0005 Then
    Print "0";
  Else
    If Flux(Num%) < 0 Then
      Print "-";
    End If
    Print Format$(Abs(Flux(Num%)), "#.###"); " V"
  End If
  ScanForm.Refresh

  End If
End Sub

