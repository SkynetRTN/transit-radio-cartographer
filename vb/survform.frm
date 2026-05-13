VERSION 5.00
Begin VB.Form SurvForm 
   Appearance      =   0  'Flat
   AutoRedraw      =   -1  'True
   BackColor       =   &H00FFFFFF&
   BorderStyle     =   1  'Fixed Single
   Caption         =   "Form1"
   ClientHeight    =   5415
   ClientLeft      =   375
   ClientTop       =   1320
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
   Picture         =   "survform.frx":0000
   ScaleHeight     =   5415
   ScaleWidth      =   8775
   Begin VB.CommandButton Command6 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   6720
      TabIndex        =   28
      Top             =   120
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command5 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   6720
      TabIndex        =   27
      Top             =   2760
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command15 
      Appearance      =   0  'Flat
      Caption         =   "Align Sweeps"
      Height          =   495
      Left            =   6720
      TabIndex        =   26
      Top             =   2160
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command14 
      Appearance      =   0  'Flat
      Caption         =   "Baseline Sweeps"
      Height          =   495
      Left            =   6720
      TabIndex        =   24
      Top             =   1560
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command13 
      Appearance      =   0  'Flat
      Caption         =   "Smooth Sweeps"
      Height          =   495
      Left            =   6720
      TabIndex        =   22
      Top             =   960
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command12 
      Appearance      =   0  'Flat
      Caption         =   "Make Image"
      Height          =   495
      Left            =   6720
      TabIndex        =   21
      Top             =   120
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Height          =   285
      Left            =   6720
      TabIndex        =   20
      Top             =   4200
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CheckBox Check2 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "Check2"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   6720
      TabIndex        =   19
      Top             =   3480
      Value           =   1  'Checked
      Visible         =   0   'False
      Width           =   255
   End
   Begin VB.CheckBox Check1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "Check1"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   6720
      TabIndex        =   18
      Top             =   3240
      Value           =   1  'Checked
      Visible         =   0   'False
      Width           =   255
   End
   Begin VB.CommandButton Command11 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   6720
      TabIndex        =   17
      Top             =   2160
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command10 
      Appearance      =   0  'Flat
      Caption         =   "Select Declination"
      Height          =   495
      Left            =   6720
      TabIndex        =   16
      Top             =   1560
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command9 
      Appearance      =   0  'Flat
      Caption         =   "Cut Segment"
      Height          =   495
      Left            =   6720
      TabIndex        =   15
      Top             =   960
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.CommandButton Command8 
      Appearance      =   0  'Flat
      Caption         =   "Calibrate Survey"
      Height          =   495
      Left            =   6720
      TabIndex        =   14
      Top             =   120
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.PictureBox Picture9 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   3600
      ScaleHeight     =   2145
      ScaleWidth      =   2865
      TabIndex        =   12
      Top             =   2760
      Visible         =   0   'False
      Width           =   2895
   End
   Begin VB.PictureBox Picture8 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   480
      ScaleHeight     =   2145
      ScaleWidth      =   2865
      TabIndex        =   11
      Top             =   2760
      Visible         =   0   'False
      Width           =   2895
   End
   Begin VB.PictureBox Picture7 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   3600
      ScaleHeight     =   2145
      ScaleWidth      =   2865
      TabIndex        =   10
      Top             =   120
      Visible         =   0   'False
      Width           =   2895
   End
   Begin VB.PictureBox Picture6 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   480
      ScaleHeight     =   2145
      ScaleWidth      =   2865
      TabIndex        =   9
      Top             =   120
      Visible         =   0   'False
      Width           =   2895
   End
   Begin VB.PictureBox Picture5 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   1815
      Left            =   6720
      Picture         =   "survform.frx":0446
      ScaleHeight     =   1785
      ScaleWidth      =   1785
      TabIndex        =   8
      Top             =   2640
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.PictureBox Picture4 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   4815
      Left            =   480
      Picture         =   "survform.frx":088C
      ScaleHeight     =   4785
      ScaleWidth      =   5985
      TabIndex        =   7
      Top             =   120
      Visible         =   0   'False
      Width           =   6015
   End
   Begin VB.PictureBox Picture3 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   480
      ScaleHeight     =   2145
      ScaleWidth      =   5985
      TabIndex        =   6
      Top             =   2760
      Width           =   6015
   End
   Begin VB.PictureBox Picture2 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   2175
      Left            =   480
      ScaleHeight     =   2145
      ScaleWidth      =   5985
      TabIndex        =   5
      Top             =   120
      Width           =   6015
   End
   Begin VB.PictureBox Picture1 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H00FFFFFF&
      ForeColor       =   &H80000008&
      Height          =   4815
      Left            =   480
      Picture         =   "survform.frx":0CD2
      ScaleHeight     =   4785
      ScaleWidth      =   5985
      TabIndex        =   4
      Top             =   120
      Visible         =   0   'False
      Width           =   6015
   End
   Begin VB.CommandButton Command4 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   6720
      TabIndex        =   3
      Top             =   2160
      Width           =   1815
   End
   Begin VB.CommandButton Command3 
      Appearance      =   0  'Flat
      Caption         =   "Baseline Segment"
      Height          =   495
      Left            =   6720
      TabIndex        =   2
      Top             =   1560
      Width           =   1815
   End
   Begin VB.CommandButton Command2 
      Appearance      =   0  'Flat
      Caption         =   "Calibrate Survey"
      Height          =   495
      Left            =   6720
      TabIndex        =   1
      Top             =   720
      Width           =   1815
   End
   Begin VB.CommandButton Command1 
      Appearance      =   0  'Flat
      Caption         =   "Accept Sweep"
      Enabled         =   0   'False
      Height          =   495
      Left            =   6720
      TabIndex        =   0
      Top             =   120
      Width           =   1815
   End
   Begin VB.Label Label10 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   120
      TabIndex        =   35
      Top             =   4560
      Visible         =   0   'False
      Width           =   255
   End
   Begin VB.Label Label9 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   120
      TabIndex        =   34
      Top             =   5040
      Visible         =   0   'False
      Width           =   255
   End
   Begin VB.Label Label8 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   6720
      TabIndex        =   33
      Top             =   4560
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.Label Label7 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "5"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   7800
      TabIndex        =   32
      Top             =   5040
      Visible         =   0   'False
      Width           =   735
   End
   Begin VB.Label Label6 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "5"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   6720
      TabIndex        =   31
      Top             =   5040
      Visible         =   0   'False
      Width           =   855
   End
   Begin VB.Label Label5 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   2520
      TabIndex        =   30
      Top             =   5040
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.Label Label4 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   2520
      TabIndex        =   29
      Top             =   5040
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.Label Label3 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   4680
      TabIndex        =   25
      Top             =   5040
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.Label Label2 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   480
      TabIndex        =   23
      Top             =   5040
      Visible         =   0   'False
      Width           =   1815
   End
   Begin VB.Label Label1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   4680
      TabIndex        =   13
      Top             =   5040
      Visible         =   0   'False
      Width           =   1815
   End
End
Attribute VB_Name = "SurvForm"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim Indy
Dim Ra!(570, 2000)
Dim Dec!(570, 2000)
Dim Flux!(570, 2000)
Dim Clr%(399, 319)
Dim Clr4%(399, 319)
Dim Clr5%(399, 319)
Dim Col4$
Dim Col5$
Dim Check%(2000)
Dim Baseline!(2000)
Dim Calib!(570)
Dim MinDec(570)
Dim MaxDec(570)
Dim MinFlux(570)
Dim MaxFlux(570)
Dim Total%(570)
Dim dat!(1024)
Dim Temp!(1024)
Dim Delta(570)
Dim Rd%(255)
Dim Grn%(255)
Dim Bl%(255)
Dim Pal!(100, 4)
Dim PalNum%
Dim R$
Dim Dc$
Dim Flx$
Dim Junk$
Dim Num%
Dim X
Dim Y
Dim MinDec1
Dim MaxDec1
Dim MinFlux1
Dim MaxFlux1
Dim MinDec2
Dim MaxDec2
Dim MinFlux2
Dim MaxFlux2
Dim Cal1
Dim Cal2
Dim CalA
Dim CalB
Dim Tot1%
Dim Tot2%
Dim CutSeg$
Dim SelSeg$
Dim Down1$
Dim Down2$
Dim Down3$
Dim Down4$
Dim XBeg%
Dim YBeg%
Dim MinMem
Dim MaxMem
Dim XTemp%
Dim YTemp%
Dim XTmp
Dim YTmp
Dim Hrs%
Dim Mins%
Dim Secs%
Dim Length%
Dim Tx$
Dim Cal$
Dim Cnt%
Dim SumX
Dim SumY
Dim SumXX
Dim SumXY
Dim B
Dim A
Dim Ld$
Dim Cross$
Dim Swp%
Dim Can$
Dim Nm$
Dim Color
Dim Red%
Dim Green%
Dim Blue%
Dim Number%
Dim Counter%
Dim SwpCnt%
Dim MinDecPI
Dim MaxDecPI
Dim MinFluxPI
Dim MaxFluxPI
Dim MinRaPI
Dim MaxRaPI
Dim BaseDeg
Dim MaxFluxPIMem
Dim MinFluxPIMem
Dim Called$
Dim Mv$
Dim SwpCntMv%
Dim CalledMv$
Dim Renew$
Dim MinDc
Dim MaxDc
Dim DecVal
Dim MaxFlx
Dim Tmp#
Dim Break%
Dim DeltaDec
Dim Wait$
Dim BaseSeg$
Dim XPlus
Dim YPlus
Dim Pict3$
Dim X1
Dim X2
Dim Y1
Dim Y2
Dim F1
Dim F2
Dim f
Dim Dist
Dim Num1%
Dim Num2%
Dim Remake$
Dim Start%
Dim MinDecI
Dim MaxDecI
Dim MinFluxI
Dim MaxFluxI
Dim MinRaI
Dim MaxRaI
Dim Block$
Dim Pix%
Dim YMax%
Dim XMax%
Dim Ross$
Dim Numb%
Dim Box$
Dim XOld
Dim YOld
Dim Cnt1%
Dim Cnt2%
Dim PixX%
Dim PixY%
Dim MinDecB
Dim MaxDecB
Dim MinFluxB
Dim MaxFluxB
Dim MinRaB
Dim MaxRaB
Dim BoxMem$
Dim XMem1
Dim XMem2
Dim YMem1
Dim YMem2
Dim Tempo$
Dim CntCnt%

Dim nn%
Dim isign%
Dim ii%
Dim jj%
Dim n%
Dim mmax%
Dim m%
Dim j%
Dim istep%
Dim I%
Dim wtemp#
Dim wr#
Dim wpr#
Dim wpi#
Dim wi#
Dim theta#
Dim tempr!
Dim tempi!
Dim wrs!
Dim wis!

Private Sub Check1_Click()
  If SurvForm.Check1.Value = 0 And SurvForm.Check2.Value = 0 Then
    SurvForm.Command8.Enabled = 0
    CurrentY = 3960
    CurrentX = 6720
    Print "Input Calibration: (V)"
    SurvForm.Text1.Text = ""
    SurvForm.Text1.Visible = -1
    SurvForm.Text1.SetFocus
  Else
    SurvForm.FontTransparent = 0
    CurrentY = 3960
    CurrentX = 6720
    Print "                                    "
    SurvForm.FontTransparent = -1
    SurvForm.Command8.Enabled = -1
    SurvForm.Text1.Visible = 0
  End If
  SurvForm.Refresh
End Sub

Private Sub Check2_Click()
  If SurvForm.Check1.Value = 0 And SurvForm.Check2.Value = 0 Then
    SurvForm.Command8.Enabled = 0
    CurrentY = 3960
    CurrentX = 6720
    Print "Input Calibration: (V)"
    SurvForm.Text1.Text = ""
    SurvForm.Text1.Visible = -1
    SurvForm.Text1.SetFocus
  Else
    SurvForm.FontTransparent = 0
    CurrentY = 3960
    CurrentX = 6720
    Print "                                    "
    SurvForm.FontTransparent = -1
    SurvForm.Command8.Enabled = -1
    SurvForm.Text1.Visible = 0
  End If
  SurvForm.Refresh
End Sub

Private Sub Command1_Click()
  Remake$ = "Y"
  BaseSeg$ = "N"
  Down1$ = "N"
  Down2$ = "N"
  Pict3$ = "N"
  For Num% = 1 To Total%(SwpCnt%)
    Baseline!(Num%) = 0
  Next
  If Mv$ <> "Y" Then
  
  Called$ = "N"
  Karaleah.SweepSurveyMenu.Enabled = -1
  If SwpCnt% <> Swp% Then
    SwpCnt% = SwpCnt% + 1
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Caption = SurvForm.Label2.Caption + " - Sweep" + Str$(SwpCnt%)
    SurvForm.FontTransparent = 0
    SurvForm.CurrentY = 4680
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                                   "
    SurvForm.FontTransparent = -1
    'If (SwpCnt% = Swp%) Then
      'SurvForm.Command1.Enabled = 0
      'SurvForm.Command2.SetFocus
    'Else
      SurvForm.Command1.SetFocus
    'End If
    SurvForm.Refresh
    MinDec(SwpCnt%) = 1000
    MaxDec(SwpCnt%) = -1000
    For Cnt% = 1 To Int(Total%(SwpCnt%) / 6) - 1
      SumX = 0
      SumY = 0
      SumXX = 0
      SumXY = 0
      For Num% = (Cnt% - 1) * 6 + 1 To (Cnt% - 1) * 6 + 12
        SumX = SumX + Num%
        SumY = SumY + Dec!(SwpCnt%, Num%)
        SumXX = SumXX + Num% ^ 2
        SumXY = SumXY + Num% * Dec!(SwpCnt%, Num%)
      Next
      B = (12 * SumXY - SumX * SumY) / (12 * SumXX - SumX ^ 2)
      A = (SumY - B * SumX) / 12
      If Cnt% = 1 Then
        For Num% = (Cnt% - 1) * 6 + 1 To (Cnt% - 1) * 6 + 9
          Dec!(SwpCnt%, Num%) = B * Num% + A
          If Dec!(SwpCnt%, Num%) < MinDec(SwpCnt%) Then
            MinDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
          End If
          If Dec!(SwpCnt%, Num%) > MaxDec(SwpCnt%) Then
            MaxDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
          End If
        Next
      ElseIf Cnt% = Int(Total%(SwpCnt%) / 6) - 1 Then
        For Num% = (Cnt% - 1) * 6 + 4 To (Cnt% - 1) * 6 + 12
          Dec!(SwpCnt%, Num%) = B * Num% + A
          If Dec!(SwpCnt%, Num%) < MinDec(SwpCnt%) Then
            MinDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
          End If
          If Dec!(SwpCnt%, Num%) > MaxDec(SwpCnt%) Then
            MaxDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
          End If
        Next
      Else
        For Num% = (Cnt% - 1) * 6 + 4 To (Cnt% - 1) * 6 + 9
          Dec!(SwpCnt%, Num%) = B * Num% + A
          If Dec!(SwpCnt%, Num%) < MinDec(SwpCnt%) Then
            MinDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
          End If
          If Dec!(SwpCnt%, Num%) > MaxDec(SwpCnt%) Then
            MaxDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
          End If
        Next
      End If
    Next
    If Total%(SwpCnt%) = 6 Then
      For Num% = 1 To 6
        If Dec!(SwpCnt%, Num%) < MinDec(SwpCnt%) Then
          MinDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
        End If
        If Dec!(SwpCnt%, Num%) > MaxDec(SwpCnt%) Then
          MaxDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
        End If
      Next
    End If
    If MinDec(SwpCnt%) = MaxDec(SwpCnt%) Then
      Dec!(SwpCnt%, Total%(SwpCnt%)) = Dec!(SwpCnt%, Total%(SwpCnt%)) + 0.01
    End If
    If Dec!(SwpCnt%, 1) > Dec!(SwpCnt%, Total%(SwpCnt%)) Then
      For Num% = 1 To Total%(SwpCnt%)
        Baseline!(Num%) = Dec!(SwpCnt%, Num%)
      Next
      For Num% = 1 To Total%(SwpCnt%)
        Dec!(SwpCnt%, Num%) = Baseline!(Total%(SwpCnt%) + 1 - Num%)
      Next
      For Num% = 1 To Total%(SwpCnt%)
        Baseline!(Num%) = Ra!(SwpCnt%, Num%)
      Next
      For Num% = 1 To Total%(SwpCnt%)
        Ra!(SwpCnt%, Num%) = Baseline!(Total%(SwpCnt%) + 1 - Num%)
      Next
      For Num% = 1 To Total%(SwpCnt%)
        Baseline!(Num%) = Flux!(SwpCnt%, Num%)
      Next
      For Num% = 1 To Total%(SwpCnt%)
        Flux!(SwpCnt%, Num%) = Baseline!(Total%(SwpCnt%) + 1 - Num%)
      Next
    End If
    For Number% = 1 To Total%(SwpCnt%) - 1
      For Num% = 1 To Total%(SwpCnt%) - 1
        If Dec!(SwpCnt%, Num% + 1) < Dec!(SwpCnt%, Num%) Then
          Dc$ = Str$(Dec!(SwpCnt%, Num%))
          Flx$ = Str$(Flux!(SwpCnt%, Num%))
          Dec!(SwpCnt%, Num%) = Dec!(SwpCnt%, Num% + 1)
          Flux!(SwpCnt%, Num%) = Flux!(SwpCnt%, Num% + 1)
          Dec!(SwpCnt%, Num% + 1) = Val(Dc$)
          Flux!(SwpCnt%, Num% + 1) = Val(Flx$)
        End If
      Next
    Next
    For Num% = 1 To Total%(SwpCnt%)
      Baseline!(Num%) = 0
    Next
    For Num% = 1 To Total%(SwpCnt%)
      X = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
     Y = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (X, Y), 15, QBColor(12)
    Next
    SurvForm.Refresh
    Cal$ = "N"
  Else
    SurvForm.Caption = SurvForm.Label2.Caption + " - Pre-Image"
    SurvForm.FontTransparent = 0
    SurvForm.CurrentY = 810
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentX = 210
    SurvForm.Print "  "
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentY = 3450
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentX = 210
    SurvForm.Print "  "
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentY = 4680
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                                   "
    SurvForm.FontTransparent = -1
    SurvForm.CurrentY = 1440
    SurvForm.CurrentX = 180
    SurvForm.Print "D"
    SurvForm.CurrentX = 180
    SurvForm.Print "e"
    SurvForm.CurrentX = 180
    SurvForm.Print "c"
    SurvForm.CurrentX = 210
    SurvForm.Print "l"
    SurvForm.CurrentX = 210
    SurvForm.Print "i"
    SurvForm.CurrentX = 180
    SurvForm.Print "n"
    SurvForm.CurrentX = 180
    SurvForm.Print "a"
    SurvForm.CurrentX = 210
    SurvForm.Print "t"
    SurvForm.CurrentX = 210
    SurvForm.Print "i"
    SurvForm.CurrentX = 180
    SurvForm.Print "o"
    SurvForm.CurrentX = 180
    SurvForm.Print "n"
    SurvForm.CurrentY = 5070
    SurvForm.CurrentX = 2760
    SurvForm.Print "Right Ascension"
    SurvForm.Command1.Visible = 0
    SurvForm.Command2.Visible = 0
    SurvForm.Command3.Visible = 0
    SurvForm.Command4.Visible = 0
    SurvForm.Command12.Visible = -1
    SurvForm.Command13.Visible = -1
    SurvForm.Command14.Visible = -1
    SurvForm.Command15.Visible = -1
    SurvForm.Command5.Visible = -1
    SurvForm.Picture2.Visible = 0
    SurvForm.Picture3.Visible = 0
    SurvForm.Picture1.Visible = -1
    SurvForm.Refresh
    Called$ = "Y"
    MinDecPI = 1000
    MaxDecPI = -1000
    MinFluxPI = 100
    MaxFluxPI = -100
    For Num% = 1 To Swp%
      If MinDec(Num%) < MinDecPI Then
        MinDecPI = MinDec(Num%)
      End If
      If MaxDec(Num%) > MaxDecPI Then
        MaxDecPI = MaxDec(Num%)
      End If
      Cnt1% = Num% - 1
      While Calib!(Cnt1%) = 0
        Cnt1% = Cnt1% - 1
      Wend
      Cnt2% = Num%
      While Calib!(Cnt2%) = 0
        Cnt2% = Cnt2% + 1
      Wend
      Cal1 = (Num% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      Cal2 = (Num% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      If MinFlux(Num%) / (Cal1 + Cal2) * 2 < MinFluxPI Then
        MinFluxPI = MinFlux(Num%) / (Cal1 + Cal2) * 2
      End If
      If MaxFlux(Num%) / (Cal1 + Cal2) * 2 > MaxFluxPI Then
        MaxFluxPI = MaxFlux(Num%) / (Cal1 + Cal2) * 2
      End If
    Next
    MinRaPI = Ra!(1, 1)
    If Ra!(Swp%, 1) < Ra!(Swp%, Total%(Swp%)) Then
      MaxRaPI = Ra!(Swp%, Total%(Swp%))
    Else
      MaxRaPI = Ra!(Swp%, 1)
    End If
    For Cnt% = 1 To Swp%
      Cnt1% = Cnt% - 1
      While Calib!(Cnt1%) = 0
        Cnt1% = Cnt1% - 1
      Wend
      Cnt2% = Cnt%
      While Calib!(Cnt2%) = 0
        Cnt2% = Cnt2% + 1
      Wend
      Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
        If Cnt% = 1 Then
          X = 5970
        Else
          X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
        If Cnt% = Swp% Then
          XTemp% = 0
        Else
          XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
      Else
        If Cnt% = 1 Then
          X = 5970
        Else
          X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
        If Cnt% = Swp% Then
          XTemp% = 0
        Else
          XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
      End If
      For Num% = 1 To Total%(Cnt%)
        Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
        Color = Int((Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
        If Color = 256 Then
          Color = 255
        ElseIf Color < 1 Then
          Color = 1
        End If
        If Color <= 255 / 7 Then
          Red% = Color * 7
          Green% = 0
          Blue% = Color * 7
        ElseIf Color <= 255 * 2 / 7 Then
          Red% = 255 - (Color - 255 / 7) * 7
          Green% = 0
          Blue% = 255
        ElseIf Color <= 255 * 3 / 7 Then
          Red% = 0
          Green% = (Color - 255 * 2 / 7) * 7
          Blue% = 255
        ElseIf Color <= 255 * 4 / 7 Then
          Red% = 0
          Green% = 255
          Blue% = 255 - (Color - 255 * 3 / 7) * 7
        ElseIf Color <= 255 * 5 / 7 Then
          Red% = (Color - 255 * 4 / 7) * 7
          Green% = 255
          Blue% = 0
        ElseIf Color <= 255 * 6 / 7 Then
          Red% = 255
          Green% = 255 - (Color - 255 * 5 / 7) * 7
          Blue% = 0
        ElseIf Color <= 255 Then
          Red% = 255
          Green% = (Color - 255 * 6 / 7) * 7
          Blue% = (Color - 255 * 6 / 7) * 7
        End If
        SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
      Next
      SurvForm.Refresh
    Next
    Opt% = 4 Or 32
    Button% = MsgBox("Save Changes to Open Survey?", Opt%, "Status Message")
    If Button% = 6 And SurvForm.Label3.Caption <> "" Then
      On Error GoTo DirError
      Open SurvForm.Label3.Caption For Output As #3
      Print #3, SurvForm.Label1.Caption
      Print #3, SurvForm.Label2.Caption
      Print #3, Swp% + 1
      Print #3, Swp%
      Print #3, Format$(Calib!(0), "#.####")
      Print #3, Format$(Calib!(Swp%), "#.####")
      For Num% = 1 To 240
        Print #3, Ra!(0, Num%)
        Print #3, Format$(Dec!(0, Num%), "#.##")
        Print #3, Format$(Flux!(0, Num%), "#.####")
      Next
      For Cnt% = 1 To Swp%
        Print #3, Format$(MinDec(Cnt%), "#.##")
        Print #3, Format$(MaxDec(Cnt%), "#.##")
        Print #3, Format$(MinFlux(Cnt%), "#.####")
        Print #3, Format$(MaxFlux(Cnt%), "#.####")
        Print #3, Format$(Calib!(Cnt%), "#.####")
        Print #3, Total%(Cnt%)
        For Num% = 1 To Total%(Cnt%)
          Print #3, Ra!(Cnt%, Num%)
          Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
          Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
        Next
      Next
      Close #3
    ElseIf Button% = 6 Then
      Load LoadData
      LoadData.Caption = "Save Survey As"
      LoadData.Text1.Enabled = -1
      LoadData.Text1.Visible = -1
      LoadData.File1.Enabled = 0
      Length% = Len(SurvForm.Label2.Caption)
      Nm$ = ""
      For Num% = 1 To Length%
        If Mid$(LTrim$(SurvForm.Label2.Caption), Num%, 1) <> " " Then
          Nm$ = Nm$ + Mid$(LTrim$(SurvForm.Label2.Caption), Num%, 1)
        End If
      Next
      LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".srv"
      LoadData.Label4.Caption = LoadData.Dir1.Path
      LoadData.File1.Pattern = "*.*"
      LoadData.Show 1
      SurvForm.Refresh
      If LoadData.Caption = "save" Then
        Open LoadData.Text1.Text For Output As #3
        Print #3, SurvForm.Label1.Caption
        Print #3, SurvForm.Label2.Caption
        Print #3, Swp% + 1
        Print #3, Swp%
        Print #3, Format$(Calib!(0), "#.####")
        Print #3, Format$(Calib!(Swp%), "#.####")
        For Num% = 1 To 240
          Print #3, Ra!(0, Num%)
          Print #3, Format$(Dec!(0, Num%), "#.##")
          Print #3, Format$(Flux!(0, Num%), "#.####")
        Next
        For Cnt% = 1 To Swp%
          Print #3, Format$(MinDec(Cnt%), "#.##")
          Print #3, Format$(MaxDec(Cnt%), "#.##")
          Print #3, Format$(MinFlux(Cnt%), "#.####")
          Print #3, Format$(MaxFlux(Cnt%), "#.####")
          Print #3, Format$(Calib!(Cnt%), "#.####")
          Print #3, Total%(Cnt%)
          For Num% = 1 To Total%(Cnt%)
            Print #3, Ra!(Cnt%, Num%)
            Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
            Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
          Next
        Next
        Close #3
        SurvForm.Label3.Caption = LoadData.Label4.Caption + "\" + LoadData.Text1.Text
        Karaleah.SaveSurveyMenu.Enabled = -1
      End If
      Unload LoadData
    End If
  End If

  ElseIf SwpCntMv% <= Swp% Then
    Mv$ = "N"
    If SurvForm.Label3.Caption <> "" Then
      Karaleah.SaveSurveyMenu.Enabled = -1
    End If
    Karaleah.SaveAsSurveyMenu.Enabled = -1
    SwpCnt% = SwpCntMv%
    Called$ = "Y"
    Can$ = "N"
    Cal$ = "Y"
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Caption = SurvForm.Label2.Caption + " - Sweep" + Str$(SwpCnt%)
    SurvForm.FontTransparent = 0
    SurvForm.CurrentY = 4680
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                                   "
    SurvForm.FontTransparent = -1
    Cnt% = SwpCnt%
    While (Calib!(Cnt%) = 0) And (Cnt% <= Swp%)
      Cnt% = Cnt% + 1
    Wend
    If (SwpCnt% = Swp%) And (Cnt% = Swp% + 1) Then
      SurvForm.Command1.Enabled = 0
      SurvForm.Command2.SetFocus
    Else
      SurvForm.Command1.Enabled = -1
      SurvForm.Command1.SetFocus
    End If
    SurvForm.Refresh
    For Num% = 1 To Total%(SwpCnt%)
      X = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      Y = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (X, Y), 15, QBColor(12)
    Next
    SurvForm.Refresh
  ElseIf SwpCntMv% > Swp% Then
    Mv$ = "N"
    If SurvForm.Label3.Caption <> "" Then
      Karaleah.SaveSurveyMenu.Enabled = -1
    End If
    Karaleah.SaveAsSurveyMenu.Enabled = -1
    SwpCnt% = SwpCntMv% - 1
    Called$ = "Y"
    Can$ = "N"
    Cal$ = "Y"
    SurvForm.Picture1.Line (0, 0)-(5970, 4770), QBColor(15), BF
    SurvForm.Caption = SurvForm.Label2.Caption + " - Pre-Image"
    SurvForm.FontTransparent = 0
    SurvForm.CurrentY = 810
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentX = 210
    SurvForm.Print "  "
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentY = 3450
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentX = 210
    SurvForm.Print "  "
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentX = 180
    SurvForm.Print "  "
    SurvForm.CurrentY = 4680
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                                   "
    SurvForm.FontTransparent = -1
    SurvForm.CurrentY = 1440
    SurvForm.CurrentX = 180
    SurvForm.Print "D"
    SurvForm.CurrentX = 180
    SurvForm.Print "e"
    SurvForm.CurrentX = 180
    SurvForm.Print "c"
    SurvForm.CurrentX = 210
    SurvForm.Print "l"
    SurvForm.CurrentX = 210
    SurvForm.Print "i"
    SurvForm.CurrentX = 180
    SurvForm.Print "n"
    SurvForm.CurrentX = 180
    SurvForm.Print "a"
    SurvForm.CurrentX = 210
    SurvForm.Print "t"
    SurvForm.CurrentX = 210
    SurvForm.Print "i"
    SurvForm.CurrentX = 180
    SurvForm.Print "o"
    SurvForm.CurrentX = 180
    SurvForm.Print "n"
    SurvForm.CurrentY = 5070
    SurvForm.CurrentX = 2760
    SurvForm.Print "Right Ascension"
    SurvForm.Command1.Visible = 0
    SurvForm.Command2.Visible = 0
    SurvForm.Command3.Visible = 0
    SurvForm.Command4.Visible = 0
    SurvForm.Command12.Visible = -1
    SurvForm.Command13.Visible = -1
    SurvForm.Command14.Visible = -1
    SurvForm.Command15.Visible = -1
    SurvForm.Command5.Visible = -1
    SurvForm.Picture2.Visible = 0
    SurvForm.Picture3.Visible = 0
    SurvForm.Picture1.Visible = -1
    SurvForm.Refresh
    MinDecPI = 1000
    MaxDecPI = -1000
    MinFluxPI = 100
    MaxFluxPI = -100
    For Num% = 1 To Swp%
      If MinDec(Num%) < MinDecPI Then
        MinDecPI = MinDec(Num%)
      End If
      If MaxDec(Num%) > MaxDecPI Then
        MaxDecPI = MaxDec(Num%)
      End If
      Cnt1% = Num% - 1
      While Calib!(Cnt1%) = 0
        Cnt1% = Cnt1% - 1
      Wend
      Cnt2% = Num%
      While Calib!(Cnt2%) = 0
        Cnt2% = Cnt2% + 1
      Wend
      Cal1 = (Num% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      Cal2 = (Num% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      If MinFlux(Num%) / (Cal1 + Cal2) * 2 < MinFluxPI Then
        MinFluxPI = MinFlux(Num%) / (Cal1 + Cal2) * 2
      End If
      If MaxFlux(Num%) / (Cal1 + Cal2) * 2 > MaxFluxPI Then
        MaxFluxPI = MaxFlux(Num%) / (Cal1 + Cal2) * 2
      End If
    Next
    MinRaPI = Ra!(1, 1)
    If Ra!(Swp%, 1) < Ra!(Swp%, Total%(Swp%)) Then
      MaxRaPI = Ra!(Swp%, Total%(Swp%))
    Else
      MaxRaPI = Ra!(Swp%, 1)
    End If
    For Cnt% = 1 To Swp%
      Cnt1% = Cnt% - 1
      While Calib!(Cnt1%) = 0
        Cnt1% = Cnt1% - 1
      Wend
      Cnt2% = Cnt%
      While Calib!(Cnt2%) = 0
        Cnt2% = Cnt2% + 1
      Wend
      Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
        If Cnt% = 1 Then
          X = 5970
        Else
          X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
        If Cnt% = Swp% Then
          XTemp% = 0
        Else
          XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
      Else
        If Cnt% = 1 Then
          X = 5970
        Else
          X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
        If Cnt% = Swp% Then
          XTemp% = 0
        Else
          XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
      End If
      For Num% = 1 To Total%(Cnt%)
        Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
        Color = Int((Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
        If Color = 256 Then
          Color = 255
        ElseIf Color < 1 Then
          Color = 1
        End If
        If Color <= 255 / 7 Then
          Red% = Color * 7
          Green% = 0
          Blue% = Color * 7
        ElseIf Color <= 255 * 2 / 7 Then
          Red% = 255 - (Color - 255 / 7) * 7
          Green% = 0
          Blue% = 255
        ElseIf Color <= 255 * 3 / 7 Then
          Red% = 0
          Green% = (Color - 255 * 2 / 7) * 7
          Blue% = 255
        ElseIf Color <= 255 * 4 / 7 Then
          Red% = 0
          Green% = 255
          Blue% = 255 - (Color - 255 * 3 / 7) * 7
        ElseIf Color <= 255 * 5 / 7 Then
          Red% = (Color - 255 * 4 / 7) * 7
          Green% = 255
          Blue% = 0
        ElseIf Color <= 255 * 6 / 7 Then
          Red% = 255
          Green% = 255 - (Color - 255 * 5 / 7) * 7
          Blue% = 0
        ElseIf Color <= 255 Then
          Red% = 255
          Green% = (Color - 255 * 6 / 7) * 7
          Blue% = (Color - 255 * 6 / 7) * 7
        End If
        SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
      Next
      SurvForm.Refresh
    Next
  End If
Exsub:
  Exit Sub
DirError:
  MsgBox Error$, 48, "Error Message"
  Resume Exsub
End Sub

Private Sub Command10_Click()
  SelSeg$ = "Y"
  If Down3$ <> "Y" Then
    Down3$ = "N"
  End If
  If Down4$ <> "Y" Then
    Down4$ = "N"
  End If

  If CutSeg$ = "Y" And Down1$ = "Y" Then
    SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture6.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If Y >= 0 And Y <= 2130 Then
        If Check%(Num%) = -1 Then
          SurvForm.Picture6.PSet (X, Y), QBColor(7)
        Else
          SurvForm.Picture6.Circle (X, Y), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  End If
  If CutSeg$ = "Y" And Down2$ = "Y" Then
    SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture7.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If Y >= 0 And Y <= 2130 Then
        If Check%(Num%) = -1 Then
          SurvForm.Picture7.PSet (X, Y), QBColor(7)
        Else
          SurvForm.Picture7.Circle (X, Y), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  End If
  CutSeg$ = "N"
  Down1$ = "N"
  Down2$ = "N"
End Sub

Private Sub Command11_Click()
  If CutSeg$ = "Y" And Down1$ = "Y" Then
    SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture6.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If Y >= 0 And Y <= 2130 Then
        If Check%(Num%) = -1 Then
          SurvForm.Picture6.PSet (X, Y), QBColor(7)
        Else
          SurvForm.Picture6.Circle (X, Y), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  End If
  If CutSeg$ = "Y" And Down2$ = "Y" Then
    SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture7.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If Y >= 0 And Y <= 2130 Then
        If Check%(Num%) = -1 Then
          SurvForm.Picture7.PSet (X, Y), QBColor(7)
        Else
          SurvForm.Picture7.Circle (X, Y), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  End If
  If SelSeg$ = "Y" And Down3$ = "Y" Then
    SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture8.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture8.PSet (X, Y), QBColor(7)
      Else
        SurvForm.Picture8.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  End If
  If SelSeg$ = "Y" And Down4$ = "Y" Then
    SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture9.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture9.PSet (X, Y), QBColor(7)
      Else
        SurvForm.Picture9.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  End If

  If (Down1$ <> "Y") And (Down2$ <> "Y") And (Down3$ <> "Y") And (Down4$ <> "Y") Then
  
  Can$ = "Y"
  SurvForm.FontTransparent = 0
  CurrentY = 2770
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentY = 3000
  CurrentX = 6720
  Print "                  "
  CurrentY = 3285
  CurrentX = 6960
  Print "                        "
  CurrentY = 3525
  CurrentX = 6960
  Print "                        "
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentY = 2430
  CurrentX = 2760
  Print "                        "
  SurvForm.FontTransparent = -1
  CurrentY = 3450
  CurrentX = 180
  Print "F"
  CurrentX = 210
  Print "l"
  CurrentX = 180
  Print "u"
  CurrentX = 180
  Print "x"
  CurrentY = 2430
  CurrentX = 3000
  Print "Declination"
  SurvForm.Command8.Visible = 0
  SurvForm.Command9.Visible = 0
  SurvForm.Command10.Visible = 0
  SurvForm.Command11.Visible = 0
  SurvForm.Command1.Visible = -1
  SurvForm.Command2.Visible = -1
  SurvForm.Command3.Visible = -1
  SurvForm.Command4.Visible = -1
  SurvForm.Check1.Visible = 0
  SurvForm.Check2.Visible = 0
  SurvForm.Check1.Value = 1
  SurvForm.Check2.Value = 1
  SurvForm.Picture6.Visible = 0
  SurvForm.Picture7.Visible = 0
  SurvForm.Picture8.Visible = 0
  SurvForm.Picture9.Visible = 0
  SurvForm.Picture2.Visible = -1
  SurvForm.Picture3.Visible = -1
  SurvForm.Refresh
  SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
  SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
  SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
  SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
  For Num% = 1 To 240
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

Private Sub Command12_Click()
  Dc$ = ""
  If Pix% = 0 Then
    Dc$ = InputBox$("Pixel Resolution (Pixels):", "Input Pixel Resolution", "2")
  Else
    Dc$ = InputBox$("Pixel Resolution (Pixels):", "Input Pixel Resolution", Str$(Pix%))
  End If
  If (Val(Dc$) - Int(Val(Dc$)) <> 0) Or (Val(Dc$) <= 0) Then
    MsgBox "Invalid Pixel Resolution", 48, "Error Message"
  Else
  
  Label10.Caption = "Y"
  PalNum% = 8
  Pal!(1, 1) = 1
  Pal!(1, 2) = 0
  Pal!(1, 3) = 0
  Pal!(1, 4) = 0
  Pal!(2, 1) = 255 / 7
  Pal!(2, 2) = 255
  Pal!(2, 3) = 0
  Pal!(2, 4) = 255
  Pal!(3, 1) = 255 * 2 / 7
  Pal!(3, 2) = 0
  Pal!(3, 3) = 0
  Pal!(3, 4) = 255
  Pal!(4, 1) = 255 * 3 / 7
  Pal!(4, 2) = 0
  Pal!(4, 3) = 255
  Pal!(4, 4) = 255
  Pal!(5, 1) = 255 * 4 / 7
  Pal!(5, 2) = 0
  Pal!(5, 3) = 255
  Pal!(5, 4) = 0
  Pal!(6, 1) = 255 * 5 / 7
  Pal!(6, 2) = 255
  Pal!(6, 3) = 255
  Pal!(6, 4) = 0
  Pal!(7, 1) = 255 * 6 / 7
  Pal!(7, 2) = 255
  Pal!(7, 3) = 0
  Pal!(7, 4) = 0
  Pal!(8, 1) = 255
  Pal!(8, 2) = 255
  Pal!(8, 3) = 255
  Pal!(8, 4) = 255
  MinDecPI = Val(Format$(MinDecPI, "#.##"))
  MaxDecPI = Val(Format$(MaxDecPI, "#.##"))
  MinFluxPI = Val(Format$(MinFluxPI, "#.####"))
  MaxFluxPI = Val(Format$(MaxFluxPI, "#.####"))
  MinRaI = MinRaPI
  MaxRaI = MaxRaPI
  MinDecI = MinDecPI
  MaxDecI = MaxDecPI
  MinFluxI = MinFluxPI
  MaxFluxI = MaxFluxPI
  Junk$ = Str$(MinFluxPI) + " " + Str$(MaxFluxPI) + " " + Str$(MinFluxI) + " " + Str$(MaxFluxI) + " " + Str$(PalNum%) + " "
  For Cnt% = 1 To PalNum%
    For Num% = 1 To 4
      Junk$ = Junk$ + Str$(Pal!(Cnt%, Num%)) + " "
    Next
  Next
  SurvForm.Label8.Caption = Junk$
  If DataForm.Label1.Caption = "" Then
    DataForm.Label1.Caption = "*"
  Else
    DataForm.Label1.Caption = ""
  End If
  DataForm.Picture7.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
  DataForm.Picture8.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
  DataForm.Picture9.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
  DataForm.Picture6.Line (0, 0)-(1650, 570), RGB(255, 255, 255), BF
  DataForm.Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  DataForm.Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  DataForm.Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  For Cnt% = 2 To PalNum%
    For Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) To Int((Pal!(Cnt%, 1) - 1) / 254 * 414)
      Red% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
      Green% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
      Blue% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
      DataForm.Picture1.Line (Num% * 15, 0)-(Num% * 15, 465), RGB(Red%, Green%, Blue%)
      Red% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 465
      Green% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 465
      Blue% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 465
      DataForm.Picture7.Line (Num% * 15, 465 - Red%)-(Num% * 15, 465), RGB(255, 0, 0)
      DataForm.Picture8.Line (Num% * 15, 465 - Green%)-(Num% * 15, 465), RGB(0, 255, 0)
      DataForm.Picture9.Line (Num% * 15, 465 - Blue%)-(Num% * 15, 465), RGB(0, 0, 255)
    Next
    Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  Next
  Num% = Int((Pal!(8, 1) - 1) / 254 * 414) * 15
  DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  If Val(Dc$) <> Pix% Then
    Remake$ = "Y"
  End If
  Pix% = Val(Dc$)
  YMax% = 5970
  XMax% = 4770
  If Remake$ <> "N" Then
    SurvForm.Picture4.Line (0, 0)-(5970, 4770), QBColor(15), BF
  End If
  Karaleah.SaveSurveyMenu.Enabled = 0
  Karaleah.SaveAsSurveyMenu.Enabled = 0
  Karaleah.SweepSurveyMenu.Enabled = 0
  Karaleah.NameSurveyMenu.Enabled = 0
  If SurvForm.Label5.Caption <> "" Then
    Karaleah.SaveImageMenu.Enabled = -1
  End If
  Karaleah.SaveAsImageMenu.Enabled = -1
  Karaleah.SaveAsBitmapMenu.Enabled = -1
  Karaleah.AppendImageMenu.Enabled = -1
  Karaleah.BiColorImageMenu.Enabled = -1
  Karaleah.TriColorImageMenu.Enabled = 0
  Karaleah.SuperImageMenu.Enabled = -1
  Karaleah.NameImageMenu.Enabled = -1
  Karaleah.ScaleImageMenu.Enabled = -1
  Karaleah.WindowImageMenu.Enabled = -1
  Karaleah.PrintImageMenu.Enabled = -1
  If SurvForm.Label4.Caption = "" Then
    SurvForm.Label4.Caption = SurvForm.Label2.Caption
  End If
  SurvForm.Caption = SurvForm.Label4.Caption + " - Image"
  SurvForm.FontTransparent = 0
  SurvForm.CurrentY = 4680
  SurvForm.CurrentX = 6720
  SurvForm.Print "                       "
  SurvForm.CurrentX = 6720
  SurvForm.Print "                       "
  SurvForm.CurrentX = 6720
  SurvForm.Print "                                   "
  SurvForm.FontTransparent = -1
  SurvForm.Command12.Visible = 0
  SurvForm.Command13.Visible = 0
  SurvForm.Command14.Visible = 0
  SurvForm.Command15.Visible = 0
  SurvForm.Command5.Visible = 0
  SurvForm.Command6.Visible = -1
  SurvForm.Picture1.Visible = 0
  SurvForm.Picture4.Visible = -1
  SurvForm.Picture5.Visible = -1
  SurvForm.Refresh
  If Remake$ <> "N" Then

  For Cnt% = 1 To 319
    For Num% = 1 To 399
      Clr%(Num%, Cnt%) = 0
    Next
  Next
  If (MaxDec(1) - MinDec(1)) / (MaxDecPI - MinDecPI) < 1 / 3 Then
    Start% = 2
  Else
    Start% = 1
  End If
  For Cnt% = Start% To Swp% - 1
    Cnt1% = Cnt% - 1
    While Calib!(Cnt1%) = 0
      Cnt1% = Cnt1% - 1
    Wend
      Cnt2% = Cnt%
    While Calib!(Cnt2%) = 0
      Cnt2% = Cnt2% + 1
    Wend
    Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Num1% = 1
    Num2% = 1
    If MinDec(Cnt%) < MinDec(Cnt% + 1) Then
      X1 = (Dec!(Cnt%, 1) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
      X2 = (Dec!(Cnt% + 1, 1) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
      Y2 = (Ra!(Cnt% + 1, 1) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
      F2 = Flux!(Cnt% + 1, 1) / (Cal1 + Cal2) * 2
      For XTmp = X1 To X2 Step 15 * Pix%
        While XTmp / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt%, Num1% + 1)
          Num1% = Num1% + 1
        Wend
        Y1 = (Ra!(Cnt%, Num1%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
        F1 = Flux!(Cnt%, Num1%) / (Cal1 + Cal2) * 2
        Dist = ((X2 - XTmp) ^ 2 + (Y2 - Y1) ^ 2) ^ 0.5
        For Number% = 0 To Int(Dist) Step Pix%
          X = Number% / Dist * (X2 - XTmp) + XTmp
          Y = Number% / Dist * (Y2 - Y1) + Y1
          f = Number% / Dist * (F2 - F1) + F1
          If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
            YTemp% = 1
          ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
            YTemp% = Int(YMax% / 15 / Pix%) + 1
          Else
            YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
          End If
          If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
            XTemp% = 1
          ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
            XTemp% = Int(XMax% / 15 / Pix%) + 1
          Else
            XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
          End If
          Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
          If Clr%(YTemp%, XTemp%) >= 5001 Then
            Clr%(YTemp%, XTemp%) = 5000
          ElseIf Clr%(YTemp%, XTemp%) < 1 Then
            Clr%(YTemp%, XTemp%) = 1
          End If
          Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
          GoSub Encolor
          SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
        Next
      Next
      SurvForm.Refresh
      If MaxDec(Cnt%) < MaxDec(Cnt% + 1) Then
        X1 = X2
        X2 = (Dec!(Cnt%, Total%(Cnt%)) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
        For X = X1 To X2 Step 15 * Pix%
          While X / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt%, Num1% + 1)
            Num1% = Num1% + 1
          Wend
          While X / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt% + 1, Num2% + 1)
            Num2% = Num2% + 1
          Wend
          Y1 = (Ra!(Cnt%, Num1%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          Y2 = (Ra!(Cnt% + 1, Num2%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          F1 = Flux!(Cnt%, Num1%) / (Cal1 + Cal2) * 2
          F2 = Flux!(Cnt% + 1, Num2%) / (Cal1 + Cal2) * 2
          Dist = Y2 - Y1
          For Number% = 0 To Int(Dist) + 15 * Pix% Step 15 * Pix%
            Y = Number% + Y1
            f = Number% / Dist * (F2 - F1) + F1
            If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
              YTemp% = 1
            ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
              YTemp% = Int(YMax% / 15 / Pix%) + 1
            Else
              YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
            End If
            If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
              XTemp% = 1
            ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
              XTemp% = Int(XMax% / 15 / Pix%) + 1
            Else
              XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
            End If
            Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
            If Clr%(YTemp%, XTemp%) >= 5001 Then
              Clr%(YTemp%, XTemp%) = 5000
            ElseIf Clr%(YTemp%, XTemp%) < 1 Then
              Clr%(YTemp%, XTemp%) = 1
            End If
            Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
            GoSub Encolor
            SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Next
        Next
        SurvForm.Refresh
        X1 = X2
        X2 = (Dec!(Cnt% + 1, Total%(Cnt% + 1)) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
        Y1 = (Ra!(Cnt%, Total%(Cnt%)) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
        F1 = Flux!(Cnt%, Total%(Cnt%)) / (Cal1 + Cal2) * 2
        For XTmp = X1 To X2 Step 15 * Pix%
          While XTmp / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt% + 1, Num2% + 1)
            Num2% = Num2% + 1
          Wend
          Y2 = (Ra!(Cnt% + 1, Num2%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          F2 = Flux!(Cnt% + 1, Num2%) / (Cal1 + Cal2) * 2
          Dist = ((XTmp - X1) ^ 2 + (Y2 - Y1) ^ 2) ^ 0.5
          For Number% = 0 To Int(Dist) Step Pix%
            X = Number% / Dist * (XTmp - X1) + X1
            Y = Number% / Dist * (Y2 - Y1) + Y1
            f = Number% / Dist * (F2 - F1) + F1
            If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
              YTemp% = 1
            ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
              YTemp% = Int(YMax% / 15 / Pix%) + 1
            Else
              YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
            End If
            If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
              XTemp% = 1
            ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
              XTemp% = Int(XMax% / 15 / Pix%) + 1
            Else
              XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
            End If
            If f < MinFluxPI Then
              f = MinFluxPI
            End If
            Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
            If Clr%(YTemp%, XTemp%) >= 5001 Then
              Clr%(YTemp%, XTemp%) = 5000
            ElseIf Clr%(YTemp%, XTemp%) < 1 Then
              Clr%(YTemp%, XTemp%) = 1
            End If
            Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
            GoSub Encolor
            SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Next
        Next
        SurvForm.Refresh
      Else
        X1 = X2
        X2 = (Dec!(Cnt% + 1, Total%(Cnt% + 1)) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
        For X = X1 To X2 Step 15 * Pix%
          While X / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt%, Num1% + 1) And (Num1% + 1 < Total%(Cnt%))
            Num1% = Num1% + 1
          Wend
          While X / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt% + 1, Num2% + 1)
            Num2% = Num2% + 1
          Wend
          Y1 = (Ra!(Cnt%, Num1%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          Y2 = (Ra!(Cnt% + 1, Num2%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          F1 = Flux!(Cnt%, Num1%) / (Cal1 + Cal2) * 2
          F2 = Flux!(Cnt% + 1, Num2%) / (Cal1 + Cal2) * 2
          Dist = Y2 - Y1
          For Number% = 0 To Int(Dist) + 15 * Pix% Step 15 * Pix%
            Y = Number% + Y1
            f = Number% / Dist * (F2 - F1) + F1
            If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
              YTemp% = 1
            ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
              YTemp% = Int(YMax% / 15 / Pix%) + 1
            Else
              YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
            End If
            If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
              XTemp% = 1
            ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
              XTemp% = Int(XMax% / 15 / Pix%) + 1
            Else
              XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
            End If
            Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
            If Clr%(YTemp%, XTemp%) >= 5001 Then
              Clr%(YTemp%, XTemp%) = 5000
            ElseIf Clr%(YTemp%, XTemp%) < 1 Then
              Clr%(YTemp%, XTemp%) = 1
            End If
            Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
            GoSub Encolor
            SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Next
        Next
        SurvForm.Refresh
        X1 = X2
        X2 = (Dec!(Cnt%, Total%(Cnt%)) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
        Y2 = (Ra!(Cnt% + 1, Total%(Cnt% + 1)) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
        F2 = Flux!(Cnt% + 1, Total%(Cnt% + 1)) / (Cal1 + Cal2) * 2
        For XTmp = X1 To X2 Step 15 * Pix%
          While XTmp / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt%, Num1% + 1)
            Num1% = Num1% + 1
          Wend
          Y1 = (Ra!(Cnt%, Num1%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          F1 = Flux!(Cnt%, Num1%) / (Cal1 + Cal2) * 2
          Dist = ((X2 - XTmp) ^ 2 + (Y2 - Y1) ^ 2) ^ 0.5
          For Number% = 0 To Int(Dist) Step Pix%
            X = Number% / Dist * (X1 - XTmp) + XTmp
            Y = Number% / Dist * (Y2 - Y1) + Y1
            f = Number% / Dist * (F2 - F1) + F1
            If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
              YTemp% = 1
            ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
              YTemp% = Int(YMax% / 15 / Pix%) + 1
            Else
              YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
            End If
            If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
              XTemp% = 1
            ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
              XTemp% = Int(XMax% / 15 / Pix%) + 1
            Else
              XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
            End If
            Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
            If Clr%(YTemp%, XTemp%) >= 5001 Then
              Clr%(YTemp%, XTemp%) = 5000
            ElseIf Clr%(YTemp%, XTemp%) < 1 Then
              Clr%(YTemp%, XTemp%) = 1
            End If
            Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
            GoSub Encolor
            SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Next
        Next
        SurvForm.Refresh
      End If
    Else
      X1 = (Dec!(Cnt% + 1, 1) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
      X2 = (Dec!(Cnt%, 1) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
      Y1 = (Ra!(Cnt%, 1) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
      F1 = Flux!(Cnt%, 1) / (Cal1 + Cal2) * 2
      For XTmp = X1 To X2 Step 15 * Pix%
        While XTmp / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt% + 1, Num2% + 1)
          Num2% = Num2% + 1
        Wend
        Y2 = (Ra!(Cnt% + 1, Num2%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
        F2 = Flux!(Cnt% + 1, Num2%) / (Cal1 + Cal2) * 2
        Dist = ((XTmp - X1) ^ 2 + (Y2 - Y1) ^ 2) ^ 0.5
        For Number% = 0 To Int(Dist) Step Pix%
          X = Number% / Dist * (XTmp - X2) + X2
          Y = Number% / Dist * (Y2 - Y1) + Y1
          f = Number% / Dist * (F2 - F1) + F1
          If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
            YTemp% = 1
          ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
            YTemp% = Int(YMax% / 15 / Pix%) + 1
          Else
            YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
          End If
          If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
            XTemp% = 1
          ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
            XTemp% = Int(XMax% / 15 / Pix%) + 1
          Else
            XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
          End If
          Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
          If Clr%(YTemp%, XTemp%) >= 5001 Then
            Clr%(YTemp%, XTemp%) = 5000
          ElseIf Clr%(YTemp%, XTemp%) < 1 Then
            Clr%(YTemp%, XTemp%) = 1
          End If
          Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
          GoSub Encolor
          SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
        Next
      Next
      SurvForm.Refresh
      If MaxDec(Cnt%) < MaxDec(Cnt% + 1) Then
        X1 = X2
        X2 = (Dec!(Cnt%, Total%(Cnt%)) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
        For X = X1 To X2 Step 15 * Pix%
          While X / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt%, Num1% + 1)
            Num1% = Num1% + 1
          Wend
          While X / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt% + 1, Num2% + 1) And (Num2% + 1 < Total%(Cnt% + 1))
            Num2% = Num2% + 1
          Wend
          Y1 = (Ra!(Cnt%, Num1%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          Y2 = (Ra!(Cnt% + 1, Num2%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          F1 = Flux!(Cnt%, Num1%) / (Cal1 + Cal2) * 2
          F2 = Flux!(Cnt% + 1, Num2%) / (Cal1 + Cal2) * 2
          Dist = Y2 - Y1
          For Number% = 0 To Int(Dist) + 15 * Pix% Step 15 * Pix%
            Y = Number% + Y1
            f = Number% / Dist * (F2 - F1) + F1
            If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
              YTemp% = 1
            ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
              YTemp% = Int(YMax% / 15 / Pix%) + 1
            Else
              YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
            End If
            If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
              XTemp% = 1
            ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
              XTemp% = Int(XMax% / 15 / Pix%) + 1
            Else
              XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
            End If
            Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
            If Clr%(YTemp%, XTemp%) >= 5001 Then
              Clr%(YTemp%, XTemp%) = 5000
            ElseIf Clr%(YTemp%, XTemp%) < 1 Then
              Clr%(YTemp%, XTemp%) = 1
            End If
            Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
            GoSub Encolor
            SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Next
        Next
        SurvForm.Refresh
        X1 = X2
        X2 = (Dec!(Cnt% + 1, Total%(Cnt% + 1)) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
        Y1 = (Ra!(Cnt%, Total%(Cnt%)) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
        F1 = Flux!(Cnt%, Total%(Cnt%)) / (Cal1 + Cal2) * 2
        For XTmp = X1 To X2 Step 15 * Pix%
          While XTmp / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt% + 1, Num2% + 1)
            Num2% = Num2% + 1
          Wend
          Y2 = (Ra!(Cnt% + 1, Num2%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          F2 = Flux!(Cnt% + 1, Num2%) / (Cal1 + Cal2) * 2
          Dist = ((XTmp - X1) ^ 2 + (Y2 - Y1) ^ 2) ^ 0.5
          For Number% = 0 To Int(Dist) Step Pix%
            X = Number% / Dist * (XTmp - X1) + X1
            Y = Number% / Dist * (Y2 - Y1) + Y1
            f = Number% / Dist * (F2 - F1) + F1
            If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
              YTemp% = 1
            ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
              YTemp% = Int(YMax% / 15 / Pix%) + 1
            Else
              YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
            End If
            If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
              XTemp% = 1
            ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
              XTemp% = Int(XMax% / 15 / Pix%) + 1
            Else
              XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
            End If
            Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
            If Clr%(YTemp%, XTemp%) >= 5001 Then
              Clr%(YTemp%, XTemp%) = 5000
            ElseIf Clr%(YTemp%, XTemp%) < 1 Then
              Clr%(YTemp%, XTemp%) = 1
            End If
            Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
            GoSub Encolor
            SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Next
        Next
        SurvForm.Refresh
      Else
        X1 = X2
        X2 = (Dec!(Cnt% + 1, Total%(Cnt% + 1)) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
        For X = X1 To X2 Step 15 * Pix%
          While X / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt%, Num1% + 1) And (Num1% + 1 < Total%(Cnt%))
            Num1% = Num1% + 1
          Wend
          While X / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt% + 1, Num2% + 1)
            Num2% = Num2% + 1
          Wend
          Y1 = (Ra!(Cnt%, Num1%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          Y2 = (Ra!(Cnt% + 1, Num2%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          F1 = Flux!(Cnt%, Num1%) / (Cal1 + Cal2) * 2
          F2 = Flux!(Cnt% + 1, Num2%) / (Cal1 + Cal2) * 2
          Dist = Y2 - Y1
          For Number% = 0 To Int(Dist) + 15 * Pix% Step 15 * Pix%
            Y = Number% + Y1
            f = Number% / Dist * (F2 - F1) + F1
            If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
              YTemp% = 1
            ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
              YTemp% = Int(YMax% / 15 / Pix%) + 1
            Else
              YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
            End If
            If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
              XTemp% = 1
            ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
              XTemp% = Int(XMax% / 15 / Pix%) + 1
            Else
              XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
            End If
            Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
            If Clr%(YTemp%, XTemp%) >= 5001 Then
              Clr%(YTemp%, XTemp%) = 5000
            ElseIf Clr%(YTemp%, XTemp%) < 1 Then
              Clr%(YTemp%, XTemp%) = 1
            End If
            Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
            GoSub Encolor
            SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Next
        Next
        SurvForm.Refresh
        X1 = X2
        X2 = (Dec!(Cnt%, Total%(Cnt%)) - MinDecPI) / (MaxDecPI - MinDecPI) * XMax%
        Y2 = (Ra!(Cnt% + 1, Total%(Cnt% + 1)) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
        F2 = Flux!(Cnt% + 1, Total%(Cnt% + 1)) / (Cal1 + Cal2) * 2
        For XTmp = X1 To X2 Step 15 * Pix%
          While XTmp / XMax% * (MaxDecPI - MinDecPI) + MinDecPI > Dec!(Cnt%, Num1% + 1)
            Num1% = Num1% + 1
          Wend
          Y1 = (Ra!(Cnt%, Num1%) - MinRaPI) / (MaxRaPI - MinRaPI) * YMax%
          F1 = Flux!(Cnt%, Num1%) / (Cal1 + Cal2) * 2
          Dist = ((X2 - XTmp) ^ 2 + (Y2 - Y1) ^ 2) ^ 0.5
          For Number% = 0 To Int(Dist) Step Pix%
            X = Number% / Dist * (X1 - XTmp) + XTmp
            Y = Number% / Dist * (Y2 - Y1) + Y1
            f = Number% / Dist * (F2 - F1) + F1
            If Int((YMax% - Y) / 15 / Pix%) + 1 < 1 Then
              YTemp% = 1
            ElseIf Int((YMax% - Y) / 15 / Pix%) + 1 > Int(YMax% / 15 / Pix%) + 1 Then
              YTemp% = Int(YMax% / 15 / Pix%) + 1
            Else
              YTemp% = Int((YMax% - Y) / 15 / Pix%) + 1
            End If
            If Int((XMax% - X) / 15 / Pix%) + 1 < 1 Then
              XTemp% = 1
            ElseIf Int((XMax% - X) / 15 / Pix%) + 1 > Int(XMax% / 15 / Pix%) + 1 Then
              XTemp% = Int(XMax% / 15 / Pix%) + 1
            Else
              XTemp% = Int((XMax% - X) / 15 / Pix%) + 1
            End If
            If f < MinFluxPI Then
              f = MinFluxPI
            End If
            Clr%(YTemp%, XTemp%) = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1
            If Clr%(YTemp%, XTemp%) >= 5001 Then
              Clr%(YTemp%, XTemp%) = 5000
            ElseIf Clr%(YTemp%, XTemp%) < 1 Then
              Clr%(YTemp%, XTemp%) = 1
            End If
            Color = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
            GoSub Encolor
            SurvForm.Picture4.Line ((YTemp% - 1) * 15 * Pix%, (XTemp% - 1) * 15 * Pix%)-(YTemp% * 15 * Pix% - 15, XTemp% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Next
        Next
        SurvForm.Refresh
      End If
    End If
  Next
  Remake$ = "N"

  End If

  End If
Exit Sub
Encolor:
  If Color >= 256 Then
    Color = 255
  ElseIf Color < 1 Then
    Color = 1
  End If
  If Color <= 255 / 7 Then
    Red% = Color * 7
    Green% = 0
    Blue% = Color * 7
  ElseIf Color <= 255 * 2 / 7 Then
    Red% = 255 - (Color - 255 / 7) * 7
    Green% = 0
    Blue% = 255
  ElseIf Color <= 255 * 3 / 7 Then
    Red% = 0
    Green% = (Color - 255 * 2 / 7) * 7
    Blue% = 255
  ElseIf Color <= 255 * 4 / 7 Then
    Red% = 0
    Green% = 255
    Blue% = 255 - (Color - 255 * 3 / 7) * 7
  ElseIf Color <= 255 * 5 / 7 Then
    Red% = (Color - 255 * 4 / 7) * 7
    Green% = 255
    Blue% = 0
  ElseIf Color <= 255 * 6 / 7 Then
    Red% = 255
    Green% = 255 - (Color - 255 * 5 / 7) * 7
    Blue% = 0
  ElseIf Color <= 255 Then
    Red% = 255
    Green% = (Color - 255 * 6 / 7) * 7
    Blue% = (Color - 255 * 6 / 7) * 7
  End If
  Return
End Sub

Private Sub Command13_Click()
  MsgBox "", , "Smooth Sweeps"
  Remake$ = "Y"
  SurvForm.FontTransparent = 0
  SurvForm.CurrentY = 4680
  SurvForm.CurrentX = 6720
  SurvForm.Print "                       "
  SurvForm.CurrentX = 6720
  SurvForm.Print "                       "
  SurvForm.CurrentX = 6720
  SurvForm.Print "                                   "
  SurvForm.FontTransparent = -1
  SurvForm.Refresh
  MaxFluxPIMem = MaxFluxPI
  MinFluxPIMem = MinFluxPI
  MinFluxPI = 100
  MaxFluxPI = -100
  For Number% = 1 To SwpCnt%
  
  Cnt1% = Number% - 1
  While Calib!(Cnt1%) = 0
    Cnt1% = Cnt1% - 1
  Wend
  Cnt2% = Number%
  While Calib!(Cnt2%) = 0
    Cnt2% = Cnt2% + 1
  Wend
  Cal1 = (Number% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
  Cal2 = (Number% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
  MinFlux(Number%) = 100
  MaxFlux(Number%) = -100
  For Cnt% = 1 To Int(Total%(Number%) / 2) - 2
    SumX = 0
    SumY = 0
    SumXX = 0
    SumXY = 0
    For Num% = (Cnt% - 1) * 2 + 1 To (Cnt% - 1) * 2 + 6
      SumX = SumX + Dec!(Number%, Num%)
      SumY = SumY + Flux!(Number%, Num%)
      SumXX = SumXX + Dec!(Number%, Num%) ^ 2
      SumXY = SumXY + Dec!(Number%, Num%) * Flux!(Number%, Num%)
    Next
    B = (6 * SumXY - SumX * SumY) / (6 * SumXX - SumX ^ 2)
    A = (SumY - B * SumX) / 6
    If Cnt% = 1 Then
      For Num% = (Cnt% - 1) * 2 + 1 To (Cnt% - 1) * 2 + 4
        Flux!(Number%, Num%) = B * Dec!(Number%, Num%) + A
        If Flux!(Number%, Num%) < MinFlux(Number%) Then
          MinFlux(Number%) = Flux!(Number%, Num%)
        End If
        If Flux!(Number%, Num%) > MaxFlux(Number%) Then
          MaxFlux(Number%) = Flux!(Number%, Num%)
        End If
      Next
    ElseIf Cnt% = Int(Total%(Number%) / 2) - 2 Then
      For Num% = (Cnt% - 1) * 2 + 3 To (Cnt% - 1) * 2 + 6
        Flux!(Number%, Num%) = B * Dec!(Number%, Num%) + A
        If Flux!(Number%, Num%) < MinFlux(Number%) Then
          MinFlux(Number%) = Flux!(Number%, Num%)
        End If
        If Flux!(Number%, Num%) > MaxFlux(Number%) Then
          MaxFlux(Number%) = Flux!(Number%, Num%)
        End If
      Next
    Else
      For Num% = (Cnt% - 1) * 2 + 3 To (Cnt% - 1) * 2 + 4
        Flux!(Number%, Num%) = B * Dec!(Number%, Num%) + A
        If Flux!(Number%, Num%) < MinFlux(Number%) Then
          MinFlux(Number%) = Flux!(Number%, Num%)
        End If
        If Flux!(Number%, Num%) > MaxFlux(Number%) Then
          MaxFlux(Number%) = Flux!(Number%, Num%)
        End If
      Next
    End If
    If MinFlux(Number%) / (Cal1 + Cal2) * 2 < MinFluxPI Then
      MinFluxPI = MinFlux(Number%) / (Cal1 + Cal2) * 2
    End If
    If MaxFlux(Number%) / (Cal1 + Cal2) * 2 > MaxFluxPI Then
      MaxFluxPI = MaxFlux(Number%) / (Cal1 + Cal2) * 2
    End If
  Next
  If Ra!(Number%, 1) < Ra!(Number%, Total%(Number%)) Then
    If Number% = 1 Then
      X = 5970
    Else
      X = 5970 - ((Ra!(Number%, 1) + Ra!(Number% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
    If Number% = SwpCnt% Then
      XTemp% = 0
    Else
      XTemp% = 5970 - ((Ra!(Number% + 1, Total%(Number% + 1)) + Ra!(Number%, Total%(Number%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
  Else
    If Number% = 1 Then
      X = 5970
    Else
      X = 5970 - ((Ra!(Number%, Total%(Number%)) + Ra!(Number% - 1, Total%(Number% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
    If Number% = SwpCnt% Then
      XTemp% = 0
    Else
      XTemp% = 5970 - ((Ra!(Number% + 1, 1) + Ra!(Number%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
  End If
  For Num% = 1 To Total%(Number%)
    Y = 4770 - (Dec!(Number%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
    Color = (Flux!(Number%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPIMem) / (MaxFluxPIMem - MinFluxPIMem) * 256!
    If Color = 256 Then
      Color = 255
    ElseIf Color < 0 Then
      Color = 0
    End If
    If Color <= 255 / 7 Then
      Red% = Color * 7
      Green% = 0
      Blue% = Color * 7
    ElseIf Color <= 255 * 2 / 7 Then
      Red% = 255 - (Color - 255 / 7) * 7
      Green% = 0
      Blue% = 255
    ElseIf Color <= 255 * 3 / 7 Then
      Red% = 0
      Green% = (Color - 255 * 2 / 7) * 7
      Blue% = 255
    ElseIf Color <= 255 * 4 / 7 Then
      Red% = 0
      Green% = 255
      Blue% = 255 - (Color - 255 * 3 / 7) * 7
    ElseIf Color <= 255 * 5 / 7 Then
      Red% = (Color - 255 * 4 / 7) * 7
      Green% = 255
      Blue% = 0
    ElseIf Color <= 255 * 6 / 7 Then
      Red% = 255
      Green% = 255 - (Color - 255 * 5 / 7) * 7
      Blue% = 0
    ElseIf Color <= 255 Then
      Red% = 255
      Green% = (Color - 255 * 6 / 7) * 7
      Blue% = (Color - 255 * 6 / 7) * 7
    End If
    SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
  Next
  SurvForm.Refresh

  Next
  For Cnt% = 1 To SwpCnt%
    Cnt1% = Cnt% - 1
    While Calib!(Cnt1%) = 0
      Cnt1% = Cnt1% - 1
    Wend
    Cnt2% = Cnt%
    While Calib!(Cnt2%) = 0
      Cnt2% = Cnt2% + 1
    Wend
    Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = SwpCnt% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    Else
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = SwpCnt% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    End If
    For Num% = 1 To Total%(Cnt%)
      Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
      Color = Int((Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 256)
      If Color = 256 Then
        Color = 255
      ElseIf Color < 0 Then
        Color = 0
      End If
      If Color <= 255 / 7 Then
        Red% = Color * 7
        Green% = 0
        Blue% = Color * 7
      ElseIf Color <= 255 * 2 / 7 Then
        Red% = 255 - (Color - 255 / 7) * 7
        Green% = 0
        Blue% = 255
      ElseIf Color <= 255 * 3 / 7 Then
        Red% = 0
        Green% = (Color - 255 * 2 / 7) * 7
        Blue% = 255
      ElseIf Color <= 255 * 4 / 7 Then
        Red% = 0
        Green% = 255
        Blue% = 255 - (Color - 255 * 3 / 7) * 7
      ElseIf Color <= 255 * 5 / 7 Then
        Red% = (Color - 255 * 4 / 7) * 7
        Green% = 255
        Blue% = 0
      ElseIf Color <= 255 * 6 / 7 Then
        Red% = 255
        Green% = 255 - (Color - 255 * 5 / 7) * 7
        Blue% = 0
      ElseIf Color <= 255 Then
        Red% = 255
        Green% = (Color - 255 * 6 / 7) * 7
        Blue% = (Color - 255 * 6 / 7) * 7
      End If
      SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
    Next
    SurvForm.Refresh
  Next
  For Num% = 1 To 1000
    Baseline!(Num%) = 0
  Next
End Sub

Private Sub Command14_Click()
  Dc$ = ""
  If BaseDeg = 0 Then
    Dc$ = InputBox$("Baseline Length (Degrees):", "Input Baseline Length", "5")
  Else
    Dc$ = InputBox$("Baseline Length (Degrees):", "Input Baseline Length", Str$(BaseDeg))
  End If
  If Val(Dc$) <= 0 Then
    MsgBox "Invalid Baseline Length", 48, "Error Message"
  Else

  Remake$ = "Y"
  BaseDeg = Val(Dc$)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                             "
  SurvForm.FontTransparent = -1
  SurvForm.Refresh
  MaxFluxPIMem = MaxFluxPI - MinFluxPI
  MinFluxPI = 100
  MaxFluxPI = -100
  For Cnt% = 1 To SwpCnt%
    Cnt1% = Cnt% - 1
    While Calib!(Cnt1%) = 0
      Cnt1% = Cnt1% - 1
    Wend
    Cnt2% = Cnt%
    While Calib!(Cnt2%) = 0
      Cnt2% = Cnt2% + 1
    Wend
    Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    MinFlux(Cnt%) = 100
    MaxFlux(Cnt%) = -100
    For Num% = 1 To Total%(Cnt%)
      Baseline!(Num%) = 1000
    Next
    Num% = 1
    Number% = 1
    While Dec!(Cnt%, Number%) < Dec!(Cnt%, Total%(Cnt%))
      Num% = Number% + 1
      While (Dec!(Cnt%, Number%) + BaseDeg > Dec!(Cnt%, Num%)) And (Num% < Total%(Cnt%))
        Num% = Num% + 1
      Wend
      A = (Flux!(Cnt%, Num%) - Flux!(Cnt%, Number%)) / (Dec!(Cnt%, Num%) - Dec!(Cnt%, Number%))
      B = Flux!(Cnt%, Num%) - A * Dec!(Cnt%, Num%)
      Numb% = Num% - 1
      While Numb% > Number%
        If (Flux!(Cnt%, Numb%) < A * Dec!(Cnt%, Numb%) + B) And (Dec!(Cnt%, Numb%) <> Dec!(Cnt%, Number%)) Then
          Num% = Numb%
          A = (Flux!(Cnt%, Num%) - Flux!(Cnt%, Number%)) / (Dec!(Cnt%, Num%) - Dec!(Cnt%, Number%))
          B = Flux!(Cnt%, Num%) - A * Dec!(Cnt%, Num%)
        End If
        Numb% = Numb% - 1
      Wend
      For Counter% = Number% To Num%
        If A * Dec!(Cnt%, Counter%) + B < Baseline!(Counter%) Then
          Baseline!(Counter%) = A * Dec!(Cnt%, Counter%) + B
        End If
      Next
      Number% = Number% + 1
    Wend
    For Num% = 1 To Total%(Cnt%)
      Flux!(Cnt%, Num%) = Flux!(Cnt%, Num%) - Baseline!(Num%)
      If Flux!(Cnt%, Num%) < MinFlux(Cnt%) Then
        MinFlux(Cnt%) = Flux!(Cnt%, Num%)
      End If
      If Flux!(Cnt%, Num%) > MaxFlux(Cnt%) Then
        MaxFlux(Cnt%) = Flux!(Cnt%, Num%)
      End If
    Next
    If MinFlux(Cnt%) / (Cal1 + Cal2) * 2 < MinFluxPI Then
      MinFluxPI = MinFlux(Cnt%) / (Cal1 + Cal2) * 2
    End If
    If MaxFlux(Cnt%) / (Cal1 + Cal2) * 2 > MaxFluxPI Then
      MaxFluxPI = MaxFlux(Cnt%) / (Cal1 + Cal2) * 2
    End If
    If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = SwpCnt% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    Else
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = SwpCnt% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    End If
    For Num% = 1 To Total%(Cnt%)
      Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
      Color = Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 / MaxFluxPIMem * 256!
      If Color = 256 Then
        Color = 255
      ElseIf Color < 0 Then
        Color = 0
      End If
      If Color <= 255 / 7 Then
        Red% = Color * 7
        Green% = 0
        Blue% = Color * 7
      ElseIf Color <= 255 * 2 / 7 Then
        Red% = 255 - (Color - 255 / 7) * 7
        Green% = 0
        Blue% = 255
      ElseIf Color <= 255 * 3 / 7 Then
        Red% = 0
        Green% = (Color - 255 * 2 / 7) * 7
        Blue% = 255
      ElseIf Color <= 255 * 4 / 7 Then
        Red% = 0
        Green% = 255
        Blue% = 255 - (Color - 255 * 3 / 7) * 7
      ElseIf Color <= 255 * 5 / 7 Then
        Red% = (Color - 255 * 4 / 7) * 7
        Green% = 255
        Blue% = 0
      ElseIf Color <= 255 * 6 / 7 Then
        Red% = 255
        Green% = 255 - (Color - 255 * 5 / 7) * 7
        Blue% = 0
      ElseIf Color <= 255 Then
        Red% = 255
        Green% = (Color - 255 * 6 / 7) * 7
        Blue% = (Color - 255 * 6 / 7) * 7
      End If
      SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
    Next
    SurvForm.Refresh
  Next
  If MinFluxPI < 0 Then
    MinFluxPI = 0
  End If
  For Cnt% = 1 To SwpCnt%
    Cnt1% = Cnt% - 1
    While Calib!(Cnt1%) = 0
      Cnt1% = Cnt1% - 1
    Wend
    Cnt2% = Cnt%
    While Calib!(Cnt2%) = 0
      Cnt2% = Cnt2% + 1
    Wend
    Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = SwpCnt% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    Else
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = SwpCnt% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    End If
    For Num% = 1 To Total%(Cnt%)
      Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
      Color = Int((Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 256)
      If Color = 256 Then
        Color = 255
      ElseIf Color < 0 Then
        Color = 0
      End If
      If Color <= 255 / 7 Then
        Red% = Color * 7
        Green% = 0
        Blue% = Color * 7
      ElseIf Color <= 255 * 2 / 7 Then
        Red% = 255 - (Color - 255 / 7) * 7
        Green% = 0
        Blue% = 255
      ElseIf Color <= 255 * 3 / 7 Then
        Red% = 0
        Green% = (Color - 255 * 2 / 7) * 7
        Blue% = 255
      ElseIf Color <= 255 * 4 / 7 Then
        Red% = 0
        Green% = 255
        Blue% = 255 - (Color - 255 * 3 / 7) * 7
      ElseIf Color <= 255 * 5 / 7 Then
        Red% = (Color - 255 * 4 / 7) * 7
        Green% = 255
        Blue% = 0
      ElseIf Color <= 255 * 6 / 7 Then
        Red% = 255
        Green% = 255 - (Color - 255 * 5 / 7) * 7
        Blue% = 0
      ElseIf Color <= 255 Then
        Red% = 255
        Green% = (Color - 255 * 6 / 7) * 7
        Blue% = (Color - 255 * 6 / 7) * 7
      End If
      SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
    Next
    SurvForm.Refresh
  Next
  For Num% = 1 To 1000
    Baseline!(Num%) = 0
  Next

  End If
End Sub

Private Sub Command15_Click()
  Dc$ = ""
  If DeltaDec = 0 Then
    Dc$ = InputBox$("Maximum Declination Shift (Degrees):", "Input Maximum Declination Shift", "3")
  Else
    Dc$ = InputBox$("Maximum Declination Shift (Degrees):", "Input Maximum Declination Shift", Str$(DeltaDec))
  End If
  If (Val(Dc$) <= 0) Or (Val(Dc$) >= 4.5) Then
    MsgBox "Invalid Maximum Declination Shift", 48, "Error Message"
  Else
  
  Remake$ = "Y"
  DeltaDec = Val(Dc$)
  SurvForm.FontTransparent = 0
  SurvForm.CurrentY = 4680
  SurvForm.CurrentX = 6720
  SurvForm.Print "                       "
  SurvForm.CurrentX = 6720
  SurvForm.Print "                       "
  SurvForm.CurrentX = 6720
  SurvForm.Print "                                   "
  SurvForm.FontTransparent = -1
  SurvForm.Refresh
  For Cnt% = 1 To Swp%
    Delta(Cnt%) = 0
  Next
  For Cnt% = 1 To Swp% - 1
    Cnt1% = Cnt% - 1
    While Calib!(Cnt1%) = 0
      Cnt1% = Cnt1% - 1
    Wend
    Cnt2% = Cnt%
    While Calib!(Cnt2%) = 0
      Cnt2% = Cnt2% + 1
    Wend
    Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    If MinDec(Cnt%) < MinDec(Cnt% + 1) Then
      MinDc = MinDec(Cnt%)
    Else
      MinDc = MinDec(Cnt% + 1)
    End If
    If MaxDec(Cnt%) > MaxDec(Cnt% + 1) Then
      MaxDc = MaxDec(Cnt%)
    Else
      MaxDc = MaxDec(Cnt% + 1)
    End If
    Number% = 1
    For Num% = 1 To 384
      DecVal = (Num% - 1) / 383 * (MaxDc - MinDc) + MinDc
      If (DecVal < MinDec(Cnt%)) Or (DecVal > MaxDec(Cnt%)) Then
        dat!(2 * Num% - 1) = 0
        dat!(2 * Num%) = 0
      Else
        While (Dec!(Cnt%, Number%) < DecVal) And (Number% < Total%(Cnt%))
          Number% = Number% + 1
        Wend
        dat!(2 * Num% - 1) = (DecVal - Dec!(Cnt%, Number% - 1)) / (Dec!(Cnt%, Number%) - Dec!(Cnt%, Number% - 1)) * (Flux!(Cnt%, Number%) - Flux!(Cnt%, Number% - 1)) + Flux!(Cnt%, Number% - 1)
        dat!(2 * Num%) = 0
      End If
    Next
    For Num% = 385 To 512
      dat!(2 * Num% - 1) = 0
      dat!(2 * Num%) = 0
    Next
    isign% = 1
    GoSub fft
    For Num% = 1 To 1024
      Temp!(Num%) = dat!(Num%)
    Next
    Number% = 1
    For Num% = 1 To 384
      DecVal = (Num% - 1) / 383 * (MaxDc - MinDc) + MinDc
      If (DecVal < MinDec(Cnt% + 1)) Or (DecVal > MaxDec(Cnt% + 1)) Then
        dat!(2 * Num% - 1) = 0
        dat!(2 * Num%) = 0
      Else
        While (Dec!(Cnt% + 1, Number%) < DecVal) And (Number% < Total%(Cnt% + 1))
          Number% = Number% + 1
        Wend
        dat!(2 * Num% - 1) = (DecVal - Dec!(Cnt + 1, Number% - 1)) / (Dec!(Cnt% + 1, Number%) - Dec!(Cnt% + 1, Number% - 1)) * (Flux!(Cnt% + 1, Number%) - Flux!(Cnt% + 1, Number% - 1)) + Flux!(Cnt% + 1, Number% - 1)
        dat!(2 * Num%) = 0
      End If
    Next
    For Num% = 385 To 512
      dat!(2 * Num% - 1) = 0
      dat!(2 * Num%) = 0
    Next
    isign% = 1
    GoSub fft
    For Num% = 1 To 512
      Tmp# = dat!(2 * Num% - 1) * Temp!(2 * Num%) - dat!(2 * Num%) * Temp!(2 * Num% - 1)
      dat!(2 * Num% - 1) = dat!(2 * Num% - 1) * Temp!(2 * Num% - 1) + dat(2 * Num%) * Temp!(2 * Num%)
      dat!(2 * Num%) = Tmp#
    Next
    isign% = -1
    GoSub fft
    MaxFlx = -1000000
    Break% = DeltaDec / (MaxDc - MinDc) * 384
    For Num% = 1 To Break%
      If dat!(2 * Num% - 1) > MaxFlx Then
        MaxFlx = dat!(2 * Num% - 1)
        DecVal = (Num% - 1) / 383 * (MaxDc - MinDc)
      End If
    Next
    For Num% = 512 - Break% + 1 To 512
      If dat!(2 * Num% - 1) > MaxFlx Then
        MaxFlx = dat!(2 * Num% - 1)
        DecVal = (Num% - 512) / 383 * (MaxDc - MinDc)
      End If
    Next
    If Cnt% = 1 Then
      Delta(1) = -DecVal / 2
      Delta(2) = DecVal / 2
    Else
      Delta(Cnt%) = MaxFlxOld / (MaxFlxOld + MaxFlx) * Delta(Cnt%) - MaxFlx / (MaxFlxOld + MaxFlx) * DecVal / 2
      Delta(Cnt% + 1) = DecVal / 2
    End If
    MaxFlxOld = MaxFlx
    For Num% = 1 To Total%(Cnt%)
      Dec!(Cnt%, Num%) = Dec!(Cnt%, Num%) + Delta(Cnt%)
    Next
    MinDec(Cnt%) = MinDec(Cnt%) + Delta(Cnt%)
    MaxDec(Cnt%) = MaxDec(Cnt%) + Delta(Cnt%)
    If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = Swp% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    Else
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = Swp% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    End If
    SurvForm.Picture1.Line (X, 0)-(XTemp%, 4770), RGB(255, 255, 255), BF
    For Num% = 1 To Total%(Cnt%)
      Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
      Color = Int((Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 256)
      If Color = 256 Then
        Color = 255
      ElseIf Color < 0 Then
        Color = 0
      End If
      If Color <= 255 / 7 Then
        Red% = Color * 7
        Green% = 0
        Blue% = Color * 7
      ElseIf Color <= 255 * 2 / 7 Then
        Red% = 255 - (Color - 255 / 7) * 7
        Green% = 0
        Blue% = 255
      ElseIf Color <= 255 * 3 / 7 Then
        Red% = 0
        Green% = (Color - 255 * 2 / 7) * 7
        Blue% = 255
      ElseIf Color <= 255 * 4 / 7 Then
        Red% = 0
        Green% = 255
        Blue% = 255 - (Color - 255 * 3 / 7) * 7
      ElseIf Color <= 255 * 5 / 7 Then
        Red% = (Color - 255 * 4 / 7) * 7
        Green% = 255
        Blue% = 0
      ElseIf Color <= 255 * 6 / 7 Then
        Red% = 255
        Green% = 255 - (Color - 255 * 5 / 7) * 7
        Blue% = 0
      ElseIf Color <= 255 Then
        Red% = 255
        Green% = (Color - 255 * 6 / 7) * 7
        Blue% = (Color - 255 * 6 / 7) * 7
      End If
      If (Y >= 0) And (Y <= 4770) Then
        SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
      End If
    Next
    SurvForm.Refresh
  Next
  Cnt% = Swp%
  Cnt1% = Cnt% - 1
  While Calib!(Cnt1%) = 0
    Cnt1% = Cnt1% - 1
  Wend
  Cnt2% = Cnt%
  While Calib!(Cnt2%) = 0
    Cnt2% = Cnt2% + 1
  Wend
  Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
  Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
  For Num% = 1 To Total%(Cnt%)
    Dec!(Cnt%, Num%) = Dec!(Cnt%, Num%) + Delta(Cnt%)
  Next
  MinDec(Cnt%) = MinDec(Cnt%) + Delta(Cnt%)
  MaxDec(Cnt%) = MaxDec(Cnt%) + Delta(Cnt%)
  If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
    If Cnt% = 1 Then
      X = 5970
    Else
      X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
    If Cnt% = Swp% Then
      XTemp% = 0
    Else
      XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
  Else
    If Cnt% = 1 Then
      X = 5970
    Else
      X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
    If Cnt% = Swp% Then
      XTemp% = 0
    Else
      XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
  End If
  SurvForm.Picture1.Line (X, 0)-(XTemp%, 4770), RGB(255, 255, 255), BF
  For Num% = 1 To Total%(Cnt%)
    Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
    Color = Int((Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 256)
    If Color = 256 Then
      Color = 255
    ElseIf Color < 0 Then
      Color = 0
    End If
    If Color <= 255 / 7 Then
      Red% = Color * 7
      Green% = 0
      Blue% = Color * 7
    ElseIf Color <= 255 * 2 / 7 Then
      Red% = 255 - (Color - 255 / 7) * 7
      Green% = 0
      Blue% = 255
    ElseIf Color <= 255 * 3 / 7 Then
      Red% = 0
      Green% = (Color - 255 * 2 / 7) * 7
      Blue% = 255
    ElseIf Color <= 255 * 4 / 7 Then
      Red% = 0
      Green% = 255
      Blue% = 255 - (Color - 255 * 3 / 7) * 7
    ElseIf Color <= 255 * 5 / 7 Then
      Red% = (Color - 255 * 4 / 7) * 7
      Green% = 255
      Blue% = 0
    ElseIf Color <= 255 * 6 / 7 Then
      Red% = 255
      Green% = 255 - (Color - 255 * 5 / 7) * 7
      Blue% = 0
    ElseIf Color <= 255 Then
      Red% = 255
      Green% = (Color - 255 * 6 / 7) * 7
      Blue% = (Color - 255 * 6 / 7) * 7
    End If
    If (Y >= 0) And (Y <= 4770) Then
      SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
    End If
  Next
  SurvForm.Refresh
  MinDecPI = 1000
  MaxDecPI = -1000
  For Num% = 1 To Swp%
    If MinDec(Num%) < MinDecPI Then
      MinDecPI = MinDec(Num%)
    End If
    If MaxDec(Num%) > MaxDecPI Then
      MaxDecPI = MaxDec(Num%)
    End If
  Next
  MinRaPI = Ra!(1, 1)
  If Ra!(Swp%, Total%(Swp%)) > Ra!(Swp%, 1) Then
    MaxRaPI = Ra!(Swp%, Total%(Swp%))
  Else
    MaxRaPI = Ra!(Swp%, 1)
  End If
  For Cnt% = 1 To Swp%
    Cnt1% = Cnt% - 1
    While Calib!(Cnt1%) = 0
      Cnt1% = Cnt1% - 1
    Wend
    Cnt2% = Cnt%
    While Calib!(Cnt2%) = 0
      Cnt2% = Cnt2% + 1
    Wend
    Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = Swp% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    Else
      If Cnt% = 1 Then
        X = 5970
      Else
        X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
      If Cnt% = Swp% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    End If
    SurvForm.Picture1.Line (X, 0)-(XTemp%, 4770), RGB(255, 255, 255), BF
    For Num% = 1 To Total%(Cnt%)
      Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
      Color = Int((Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 256)
      If Color = 256 Then
        Color = 255
      ElseIf Color < 0 Then
        Color = 0
      End If
      If Color <= 255 / 7 Then
        Red% = Color * 7
        Green% = 0
        Blue% = Color * 7
      ElseIf Color <= 255 * 2 / 7 Then
        Red% = 255 - (Color - 255 / 7) * 7
        Green% = 0
        Blue% = 255
      ElseIf Color <= 255 * 3 / 7 Then
        Red% = 0
        Green% = (Color - 255 * 2 / 7) * 7
        Blue% = 255
      ElseIf Color <= 255 * 4 / 7 Then
        Red% = 0
        Green% = 255
        Blue% = 255 - (Color - 255 * 3 / 7) * 7
      ElseIf Color <= 255 * 5 / 7 Then
        Red% = (Color - 255 * 4 / 7) * 7
        Green% = 255
        Blue% = 0
      ElseIf Color <= 255 * 6 / 7 Then
        Red% = 255
        Green% = 255 - (Color - 255 * 5 / 7) * 7
        Blue% = 0
      ElseIf Color <= 255 Then
        Red% = 255
        Green% = (Color - 255 * 6 / 7) * 7
        Blue% = (Color - 255 * 6 / 7) * 7
      End If
      If (Y >= 0) And (Y <= 4770) Then
        SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
      End If
    Next
    SurvForm.Refresh
  Next
Exit Sub

fft:
  
  nn% = 512
  n% = 2 * nn%
  j% = 1
  For ii% = 1 To nn%
    I% = 2 * ii% - 1
    If j% > I% Then
      tempr! = dat!(j%)
      tempi! = dat!(j% + 1)
      dat!(j%) = dat!(I%)
      dat!(j% + 1) = dat!(I% + 1)
      dat!(I%) = tempr!
      dat!(I% + 1) = tempi!
    End If
    m% = Int(n% / 2)
    While (m% >= 2) And (j% > m%)
      j% = j% - m%
      m% = Int(m% / 2)
    Wend
    j% = j% + m%
  Next
  mmax% = 2
  While n% > mmax%
    istep% = 2 * mmax%
    theta# = 6.28318530717959 / (isign% * mmax%)
    wpr# = -2 * (Sin(theta# / 2)) ^ 2
    wpi# = Sin(theta#)
    wr# = 1
    wi# = 0
    For ii% = 1 To Int(mmax% / 2)
      m% = 2 * ii% - 1
      wrs! = wr#
      wis! = wi#
      For jj% = 0 To Int((n% - m%) / istep%)
        I% = m% + jj% * istep%
        j% = I% + mmax%
        tempr! = wrs! * dat!(j%) - wis! * dat!(j% + 1)
        tempi! = wrs! * dat!(j% + 1) + wis! * dat!(j%)
        dat!(j%) = dat!(I%) - tempr!
        dat!(j% + 1) = dat!(I% + 1) - tempi!
        dat!(I%) = dat!(I%) + tempr!
        dat!(I% + 1) = dat!(I% + 1) + tempi!
      Next
      wtemp# = wr#
      wr# = wr# * wpr# - wi# * wpi# + wr#
      wi# = wi# * wpr# + wtemp# * wpi# + wi#
    Next
    mmax% = istep%
  Wend
  Return

  End If
End Sub

Private Sub Command2_Click()
  SurvForm.FontTransparent = 0
  CurrentY = 3450
  CurrentX = 180
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
    Print "                                "
  CurrentY = 2430
  CurrentX = 3000
  Print "                        "
  SurvForm.FontTransparent = -1
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
  CurrentY = 3000
  CurrentX = 6720
  Print "Calibrations"
  SurvForm.Command1.Visible = 0
  SurvForm.Command2.Visible = 0
  SurvForm.Command3.Visible = 0
  SurvForm.Command4.Visible = 0
  SurvForm.Command8.Enabled = -1
  SurvForm.Command8.Visible = -1
  SurvForm.Command9.Visible = -1
  SurvForm.Command10.Visible = -1
  SurvForm.Command11.Visible = -1
  SurvForm.Command8.SetFocus
  SurvForm.Check1.Visible = -1
  SurvForm.Check2.Visible = -1
  SurvForm.Picture2.Visible = 0
  SurvForm.Picture3.Visible = 0
  SurvForm.Picture6.Visible = -1
  SurvForm.Picture7.Visible = -1
  SurvForm.Picture8.Visible = -1
  SurvForm.Picture9.Visible = -1
  SurvForm.Refresh
  
  For Num% = 1 To 240
    Check%(Num%) = 0
  Next
  MinDec1 = 1000
  MaxDec1 = -1000
  MinFlux1 = 100
  MaxFlux1 = -100
  For Num% = 1 To 120
    If Dec!(0, Num%) < MinDec1 Then
      MinDec1 = Dec!(0, Num%)
    End If
    If Dec!(0, Num%) > MaxDec1 Then
      MaxDec1 = Dec!(0, Num%)
    End If
    If Flux!(0, Num%) < MinFlux1 Then
      MinFlux1 = Flux!(0, Num%)
    End If
    If Flux!(0, Num%) > MaxFlux1 Then
      MaxFlux1 = Flux!(0, Num%)
    End If
  Next
  MinDec2 = 1000
  MaxDec2 = -1000
  MinFlux2 = 100
  MaxFlux2 = -100
  For Num% = 121 To 240
    If Dec!(0, Num%) < MinDec2 Then
      MinDec2 = Dec!(0, Num%)
    End If
    If Dec!(0, Num%) > MaxDec2 Then
      MaxDec2 = Dec!(0, Num%)
    End If
    If Flux!(0, Num%) < MinFlux2 Then
      MinFlux2 = Flux!(0, Num%)
    End If
    If Flux!(0, Num%) > MaxFlux2 Then
      MaxFlux2 = Flux!(0, Num%)
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
  X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
  SurvForm.Picture6.Line (X, 0)-(X, 2145), QBColor(8)
  SurvForm.Picture8.Line (X, 0)-(X, 2145), QBColor(8)
  X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
  SurvForm.Picture7.Line (X, 0)-(X, 2145), QBColor(8)
  SurvForm.Picture9.Line (X, 0)-(X, 2145), QBColor(8)
  For Num% = 1 To 120
    X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    Y = 2130 - (Flux!(0, Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
    SurvForm.Picture6.Circle (X, Y), 15, QBColor(12)
    Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
    SurvForm.Picture8.Circle (X, Y), 15, QBColor(9)
  Next
  For Num% = 121 To 240
    X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    Y = 2130 - (Flux!(0, Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
    SurvForm.Picture7.Circle (X, Y), 15, QBColor(12)
    Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
    SurvForm.Picture9.Circle (X, Y), 15, QBColor(9)
  Next
  SurvForm.Refresh
 
  Cal1 = 0
  Cal2 = 0
  For Num% = 1 To 60
    Cal1 = Cal1 + Flux!(0, Num%) - Flux!(0, Num% + 60)
    Cal2 = Cal2 + Flux!(0, 120 + Num%) - Flux!(0, 180 + Num%)
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
  SurvForm.Refresh
End Sub

Private Sub Command3_Click()
  BaseSeg$ = "Y"
  If Down2$ <> "Y" Then
    Down2$ = "N"
  End If
  If Down3$ <> "Y" Then
    Down3$ = "N"
  End If
End Sub

Private Sub Command4_Click()
  If BaseSeg$ = "Y" And (Down2$ = "Y" Or Down3$ = "Y") Then
    BaseSeg$ = "N"
    If Down2$ = "Y" Then
      Down2$ = "N"
      SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
      For Num% = 1 To Total%(SwpCnt%)
        XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
        YTemp% = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
        SurvForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(12)
      Next
    End If
    If Down3$ = "Y" Then
      Down3$ = "N"
      SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
      For Num% = 1 To Total%(SwpCnt%)
        XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
        YTemp% = 2130 - (Baseline!(Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
        SurvForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(9)
      Next
    End If
    SurvForm.Refresh
  ElseIf Mv$ <> "Y" Then
  
  Opt% = 3 Or 32
  Button% = MsgBox("Save Changes to Open Survey?", Opt%, "Status Message")
  If Button% = 6 And SurvForm.Label3.Caption <> "" Then
    On Error GoTo DirrrError
    Open SurvForm.Label3.Caption For Output As #3
    Print #3, SurvForm.Label1.Caption
    Print #3, SurvForm.Label2.Caption
    Print #3, SwpCnt%
    Print #3, Swp%
    For Cnt% = 0 To Swp%
      Print #3, Format$(MinDec(Cnt%), "#.##")
      Print #3, Format$(MaxDec(Cnt%), "#.##")
      Print #3, Format$(MinFlux(Cnt%), "#.####")
      Print #3, Format$(MaxFlux(Cnt%), "#.####")
      Print #3, Format$(Calib!(Cnt%), "#.####")
      Print #3, Total%(Cnt%)
      For Num% = 1 To Total%(Cnt%) + 120
        Print #3, Ra!(Cnt%, Num%)
        Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
        Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
      Next
    Next
    Close #3
  ElseIf Button% = 6 Then
    Load LoadData
    LoadData.Caption = "Save Survey As"
    LoadData.Text1.Enabled = -1
    LoadData.Text1.Visible = -1
    LoadData.File1.Enabled = 0
    Length% = Len(SurvForm.Label2.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label2.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(SurvForm.Label2.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".srv"
    LoadData.Label4.Caption = LoadData.Dir1.Path
    LoadData.File1.Pattern = "*.*"
    LoadData.Show 1
    SurvForm.Refresh
    If LoadData.Caption = "save" Then
      Open LoadData.Text1.Text For Output As #3
      Print #3, SurvForm.Label1.Caption
      Print #3, SurvForm.Label2.Caption
      Print #3, Swp%
      For Cnt% = 1 To SwpCnt% - 1
        Print #3, Format$(MinDec(Cnt%), "#.##")
        Print #3, Format$(MaxDec(Cnt%), "#.##")
        Print #3, Format$(MinFlux(Cnt%), "#.####")
        Print #3, Format$(MaxFlux(Cnt%), "#.####")
        Print #3, Total%(Cnt%)
        Print #3, "Y"
        For Num% = 1 To Total%(Cnt%)
          Print #3, Ra!(Cnt%, Num%)
          Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
          Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
        Next
      Next
      If Called$ = "Y" Then
        Print #3, Format$(MinDec(SwpCnt%), "#.##")
        Print #3, Format$(MaxDec(SwpCnt%), "#.##")
        Print #3, Format$(MinFlux(SwpCnt%), "#.####")
        Print #3, Format$(MaxFlux(SwpCnt%), "#.####")
        Print #3, Total%(SwpCnt%)
        Print #3, "Y"
        For Num% = 1 To Total%(SwpCnt%)
          Print #3, Ra!(SwpCnt%, Num%)
          Print #3, Format$(Dec!(SwpCnt%, Num%), "#.##")
          Print #3, Format$(Flux!(SwpCnt%, Num%), "#.####")
        Next
      Else
        Print #3, Format$(MinDec(SwpCnt%), "#.##")
        Print #3, Format$(MaxDec(SwpCnt%), "#.##")
        Print #3, Format$(MinFlux(SwpCnt%), "#.####")
        Print #3, Format$(MaxFlux(SwpCnt%), "#.####")
        Print #3, Total%(SwpCnt%)
        Print #3, "N"
        For Num% = 1 To Total%(SwpCnt%) + 240
          Print #3, Ra!(SwpCnt%, Num%)
          Print #3, Format$(Dec!(SwpCnt%, Num%), "#.##")
          Print #3, Format$(Flux!(SwpCnt%, Num%), "#.###")
        Next
      End If
      For Cnt% = SwpCnt% + 1 To Swp%
        Print #3, Format$(MinDec(Cnt%), "#.##")
        Print #3, Format$(MaxDec(Cnt%), "#.##")
        Print #3, Format$(MinFlux(Cnt%), "#.####")
        Print #3, Format$(MaxFlux(Cnt%), "#.####")
        Print #3, Total%(Cnt%)
        Print #3, "N"
        For Num% = 1 To Total%(Cnt%) + 240
          Print #3, Ra!(Cnt%, Num%)
          Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
          Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
        Next
      Next
      Close #3
    Else
      Wait$ = "Y"
    End If
    Unload LoadData
  End If
  If Button% <> 2 And Wait$ <> "Y" Then
    Karaleah.SaveSurveyMenu.Enabled = 0
    Karaleah.SaveAsSurveyMenu.Enabled = 0
    Karaleah.SweepSurveyMenu.Enabled = 0
    Karaleah.NameSurveyMenu.Enabled = 0
    Unload SurvForm
  ElseIf Wait$ = "Y" Then
    Wait$ = "N"
  End If

  Else
    Opt% = 1 Or 48
    Button% = MsgBox("Open Survey Will Be Discarded", Opt%, "Status Message")
    If Button% = 1 Then
      Karaleah.SaveSurveyMenu.Enabled = 0
      Karaleah.SaveAsSurveyMenu.Enabled = 0
      Karaleah.SweepSurveyMenu.Enabled = 0
      Karaleah.NameSurveyMenu.Enabled = 0
      Unload SurvForm
    End If
  End If
Exxxsub:
  Exit Sub
DirrrError:
  MsgBox Error$, 48, "Error Message"
  Resume Exxxsub
End Sub

Private Sub Command5_Click()
  Opt% = 3 Or 32
  Button% = MsgBox("Save Changes to Open Survey?", Opt%, "Status Message")
  If Button% = 6 And SurvForm.Label3.Caption <> "" Then
    On Error GoTo DirrError
    Open SurvForm.Label3.Caption For Output As #3
    Print #3, SurvForm.Label1.Caption
    Print #3, SurvForm.Label2.Caption
    Print #3, Swp% + 1
    Print #3, Swp%
    For Cnt% = 0 To Swp%
      Print #3, Format$(MinDec(Cnt%), "#.##")
      Print #3, Format$(MaxDec(Cnt%), "#.##")
      Print #3, Format$(MinFlux(Cnt%), "#.####")
      Print #3, Format$(MaxFlux(Cnt%), "#.####")
      Print #3, Format$(Calib!(Cnt%), "#.####")
      Print #3, Total%(Cnt%)
      For Num% = 1 To Total%(Cnt%) + 120
        Print #3, Ra!(Cnt%, Num%)
        Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
        Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
      Next
    Next
    Close #3
  ElseIf Button% = 6 Then
    Load LoadData
    LoadData.Caption = "Save Survey As"
    LoadData.Text1.Enabled = -1
    LoadData.Text1.Visible = -1
    LoadData.File1.Enabled = 0
    Length% = Len(SurvForm.Label2.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label2.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(SurvForm.Label2.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".srv"
    LoadData.Label4.Caption = LoadData.Dir1.Path
    LoadData.File1.Pattern = "*.*"
    LoadData.Show 1
    SurvForm.Refresh
    If LoadData.Caption = "save" Then
      Open LoadData.Text1.Text For Output As #3
      Print #3, SurvForm.Label1.Caption
      Print #3, SurvForm.Label2.Caption
      Print #3, Swp%
      For Cnt% = 1 To Swp%
        Print #3, Format$(MinDec(Cnt%), "#.##")
        Print #3, Format$(MaxDec(Cnt%), "#.##")
        Print #3, Format$(MinFlux(Cnt%), "#.####")
        Print #3, Format$(MaxFlux(Cnt%), "#.####")
        Print #3, Total%(Cnt%)
        Print #3, "Y"
        For Num% = 1 To Total%(Cnt%)
          Print #3, Ra!(Cnt%, Num%)
          Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
          Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
        Next
      Next
      Close #3
    Else
      Wait$ = "Y"
    End If
    Unload LoadData
  End If
  If Button% <> 2 And Wait$ <> "Y" Then
    Karaleah.SaveSurveyMenu.Enabled = 0
    Karaleah.SaveAsSurveyMenu.Enabled = 0
    Karaleah.SweepSurveyMenu.Enabled = 0
    Karaleah.NameSurveyMenu.Enabled = 0
    Unload SurvForm
  ElseIf Wait$ = "Y" Then
    Wait$ = "N"
  End If
Exxsub:
  Exit Sub
DirrError:
  MsgBox Error$, 48, "Error Message"
  Resume Exxsub
End Sub

Private Sub Command6_Click()
If Block$ <> "Y" Then
  Opt% = 3 Or 32
  Button% = MsgBox("Save Changes to Open Image?", Opt%, "Status Message")
  If Button% = 6 And SurvForm.Label5.Caption <> "" Then
    On Error GoTo DirrrrError
    Open SurvForm.Label5.Caption For Output As #3
    Close #3
    Open SurvForm.Label5.Caption For Binary As #3
    Length% = Len(SurvForm.Label4.Caption)
    Put #3, 1, Length%
    Junk$ = SurvForm.Label4.Caption
    Put #3, , Junk$
    Length% = Len(Str$(MinRaI))
    Put #3, , Length%
    Junk$ = Str$(MinRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecI))
    Put #3, , Length%
    Junk$ = Str$(MinDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MinRaPI))
    Put #3, , Length%
    Junk$ = Str$(MinRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaPI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecPI))
    Put #3, , Length%
    Junk$ = Str$(MinDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecPI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(Pix%))
    Put #3, , Length%
    Junk$ = Str$(Pix%)
    Put #3, , Junk$
    Length% = Len(Str$(PalNum%))
    Put #3, , Length%
    Junk$ = Str$(PalNum%)
    Put #3, , Junk$
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Length% = Len(Str$(Pal!(Cnt%, Num%)))
        Put #3, , Length%
        Junk$ = Str$(Pal!(Cnt%, Num%))
        Put #3, , Junk$
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Length% = Clr%(Num%, Cnt%)
        Put #3, , Length%
      Next
    Next
    Close #3
  ElseIf Button% = 6 Then
    Load LoadData
    LoadData.Caption = "Save Image As"
    LoadData.Text1.Enabled = -1
    LoadData.Text1.Visible = -1
    LoadData.File1.Enabled = 0
    Length% = Len(SurvForm.Label4.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label4.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(SurvForm.Label4.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".img"
    LoadData.Label4.Caption = LoadData.Dir1.Path
    LoadData.File1.Pattern = "*.*"
    LoadData.Show 1
    SurvForm.Refresh
    If LoadData.Caption = "save" Then
    
    Open LoadData.Text1.Text For Output As #3
    Close #3
    Open LoadData.Text1.Text For Binary As #3
    Length% = Len(SurvForm.Label4.Caption)
    Put #3, 1, Length%
    Junk$ = SurvForm.Label4.Caption
    Put #3, , Junk$
    Length% = Len(Str$(MinRaI))
    Put #3, , Length%
    Junk$ = Str$(MinRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecI))
    Put #3, , Length%
    Junk$ = Str$(MinDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MinRaPI))
    Put #3, , Length%
    Junk$ = Str$(MinRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaPI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecPI))
    Put #3, , Length%
    Junk$ = Str$(MinDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecPI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(Pix%))
    Put #3, , Length%
    Junk$ = Str$(Pix%)
    Put #3, , Junk$
    Length% = Len(Str$(PalNum%))
    Put #3, , Length%
    Junk$ = Str$(PalNum%)
    Put #3, , Junk$
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Length% = Len(Str$(Pal!(Cnt%, Num%)))
        Put #3, , Length%
        Junk$ = Str$(Pal!(Cnt%, Num%))
        Put #3, , Junk$
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Length% = Clr%(Num%, Cnt%)
        Put #3, , Length%
      Next
    Next
    Close #3
    
    Else
      Wait$ = "Y"
    End If
    Unload LoadData
  End If
  If (Button% <> 2) And (Wait$ <> "Y") Then
    Karaleah.SaveAsImageMenu.Enabled = 0
    Karaleah.SaveImageMenu.Enabled = 0
    Karaleah.AppendImageMenu.Enabled = 0
    Karaleah.BiColorImageMenu.Enabled = 0
    Karaleah.TriColorImageMenu.Enabled = 0
    Karaleah.SuperImageMenu.Enabled = 0
    Karaleah.NameImageMenu.Enabled = 0
    Karaleah.ScaleImageMenu.Enabled = 0
    Karaleah.WindowImageMenu.Enabled = 0
    Karaleah.PrintImageMenu.Enabled = 0
    Label10.Caption = "N"
    If SurvForm.Label3.Caption <> "" Then
      Karaleah.SaveSurveyMenu.Enabled = -1
    End If
    Karaleah.SaveAsSurveyMenu.Enabled = -1
    Karaleah.SweepSurveyMenu.Enabled = -1
    Karaleah.NameSurveyMenu.Enabled = -1
    SurvForm.Caption = SurvForm.Label2.Caption + " - Pre-Image"
    SurvForm.Label5.Caption = ""
    SurvForm.FontTransparent = 0
    SurvForm.CurrentY = 4680
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                       "
    SurvForm.CurrentX = 6720
    SurvForm.Print "                                   "
    SurvForm.FontTransparent = -1
    SurvForm.Command6.Visible = 0
    SurvForm.Command12.Visible = -1
    SurvForm.Command13.Visible = -1
    SurvForm.Command14.Visible = -1
    SurvForm.Command15.Visible = -1
    SurvForm.Command5.Visible = -1
    SurvForm.Picture4.Visible = 0
    SurvForm.Picture5.Visible = 0
    SurvForm.Picture1.Visible = -1
    Remake$ = "Y"
    SurvForm.Picture5.Line (0, 0)-(1815, 1815), RGB(255, 255, 255), BF
    SurvForm.Refresh
  ElseIf Wait$ = "Y" Then
    Wait$ = "N"
  End If
Else
  Opt% = 3 Or 32
  Button% = MsgBox("Save Changes to Open Image?", Opt%, "Status Message")
  If Button% = 6 And SurvForm.Label5.Caption <> "" Then
    On Error GoTo DirrrrError
    Open SurvForm.Label5.Caption For Output As #3
    Close #3
    Open SurvForm.Label5.Caption For Binary As #3
    Length% = Len(SurvForm.Label4.Caption)
    Put #3, 1, Length%
    Junk$ = SurvForm.Label4.Caption
    Put #3, , Junk$
    Length% = Len(Str$(MinRaI))
    Put #3, , Length%
    Junk$ = Str$(MinRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecI))
    Put #3, , Length%
    Junk$ = Str$(MinDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MinRaPI))
    Put #3, , Length%
    Junk$ = Str$(MinRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaPI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecPI))
    Put #3, , Length%
    Junk$ = Str$(MinDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecPI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(Pix%))
    Put #3, , Length%
    Junk$ = Str$(Pix%)
    Put #3, , Junk$
    Length% = Len(Str$(PalNum%))
    Put #3, , Length%
    Junk$ = Str$(PalNum%)
    Put #3, , Junk$
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Length% = Len(Str$(Pal!(Cnt%, Num%)))
        Put #3, , Length%
        Junk$ = Str$(Pal!(Cnt%, Num%))
        Put #3, , Junk$
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Length% = Clr%(Num%, Cnt%)
        Put #3, , Length%
      Next
    Next
    Close #3
  ElseIf Button% = 6 Then
    Load LoadData
    LoadData.Caption = "Save Image As"
    LoadData.Text1.Enabled = -1
    LoadData.Text1.Visible = -1
    LoadData.File1.Enabled = 0
    Length% = Len(SurvForm.Label4.Caption)
    Nm$ = ""
    For Num% = 1 To Length%
      If Mid$(LTrim$(SurvForm.Label4.Caption), Num%, 1) <> " " Then
        Nm$ = Nm$ + Mid$(LTrim$(SurvForm.Label4.Caption), Num%, 1)
      End If
    Next
    LoadData.Text1.Text = LCase$(Left$(Nm$, 8)) + ".img"
    LoadData.Label4.Caption = LoadData.Dir1.Path
    LoadData.File1.Pattern = "*.*"
    LoadData.Show 1
    SurvForm.Refresh
    If LoadData.Caption = "save" Then
    
    Open LoadData.Text1.Text For Output As #3
    Close #3
    Open LoadData.Text1.Text For Binary As #3
    Length% = Len(SurvForm.Label4.Caption)
    Put #3, 1, Length%
    Junk$ = SurvForm.Label4.Caption
    Put #3, , Junk$
    Length% = Len(Str$(MinRaI))
    Put #3, , Length%
    Junk$ = Str$(MinRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecI))
    Put #3, , Length%
    Junk$ = Str$(MinDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MinRaPI))
    Put #3, , Length%
    Junk$ = Str$(MinRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaPI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecPI))
    Put #3, , Length%
    Junk$ = Str$(MinDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecPI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(Pix%))
    Put #3, , Length%
    Junk$ = Str$(Pix%)
    Put #3, , Junk$
    Length% = Len(Str$(PalNum%))
    Put #3, , Length%
    Junk$ = Str$(PalNum%)
    Put #3, , Junk$
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Length% = Len(Str$(Pal!(Cnt%, Num%)))
        Put #3, , Length%
        Junk$ = Str$(Pal!(Cnt%, Num%))
        Put #3, , Junk$
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Length% = Clr%(Num%, Cnt%)
        Put #3, , Length%
      Next
    Next
    Close #3
    
    Else
      Wait$ = "Y"
    End If
    Unload LoadData
  End If
  If Button% <> 2 And Wait$ <> "Y" Then
    Karaleah.SaveImageMenu.Enabled = 0
    Karaleah.SaveAsImageMenu.Enabled = 0
    Karaleah.AppendImageMenu.Enabled = 0
    Karaleah.BiColorImageMenu.Enabled = 0
    Karaleah.TriColorImageMenu.Enabled = 0
    Karaleah.SuperImageMenu.Enabled = 0
    Karaleah.NameImageMenu.Enabled = 0
    Karaleah.ScaleImageMenu.Enabled = 0
    Karaleah.WindowImageMenu.Enabled = 0
    Karaleah.PrintImageMenu.Enabled = 0
    Unload SurvForm
  ElseIf Wait$ = "Y" Then
    Wait$ = "N"
  End If
End If
Exxxxsub:
  Exit Sub
DirrrrError:
  MsgBox Error$, 48, "Error Message"
  Resume Exxxxsub
End Sub

Private Sub Command8_Click()
  SurvForm.FontTransparent = 0
  CurrentY = 2770
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 210
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentX = 180
  Print "  "
  CurrentY = 2430
  CurrentX = 2760
  Print "                        "
  CurrentY = 3000
  CurrentX = 6720
  Print "                  "
  CurrentY = 3285
  CurrentX = 6960
  Print "                        "
  CurrentY = 3525
  CurrentX = 6960
  Print "                        "
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  SurvForm.FontTransparent = -1
  CurrentY = 3450
  CurrentX = 180
  Print "F"
  CurrentX = 210
  Print "l"
  CurrentX = 180
  Print "u"
  CurrentX = 180
  Print "x"
  CurrentY = 2430
  CurrentX = 3000
  Print "Declination"
  SurvForm.Command8.Visible = 0
  SurvForm.Command9.Visible = 0
  SurvForm.Command10.Visible = 0
  SurvForm.Command11.Visible = 0
  SurvForm.Command1.Enabled = -1
  SurvForm.Command1.Visible = -1
  SurvForm.Command2.Visible = -1
  SurvForm.Command3.Visible = -1
  SurvForm.Command4.Visible = -1
  SurvForm.Check1.Visible = 0
  SurvForm.Check2.Visible = 0
  SurvForm.Check1.Value = 1
  SurvForm.Check2.Value = 1
  SurvForm.Picture6.Visible = 0
  SurvForm.Picture7.Visible = 0
  SurvForm.Picture8.Visible = 0
  SurvForm.Picture9.Visible = 0
  SurvForm.Picture2.Visible = -1
  SurvForm.Picture3.Visible = -1
  SurvForm.Refresh
  SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
  SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
  SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
  SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
  For Num% = 1 To 120
    Check%(Num%) = 0
  Next
  CutSeg$ = "N"
  SelSeg$ = "N"
  Down1$ = "N"
  Down2$ = "N"
  Down3$ = "N"
  Down4$ = "N"
  Cal$ = "Y"
  
  If Renew$ = "Y" And Mv$ <> "Y" Then
    Renew$ = "N"
    If SurvForm.Label3.Caption <> "" Then
      Karaleah.SaveSurveyMenu.Enabled = -1
    End If
    Karaleah.SaveAsSurveyMenu.Enabled = -1
    If SwpCnt% <> 1 Then
      Karaleah.SweepSurveyMenu.Enabled = -1
    End If
  ElseIf Renew$ = "Y" And Mv$ = "Y" Then
    Renew = "N"
    If SwpCntMv% <> 1 Then
      Karaleah.SweepSurveyMenu.Enabled = -1
    End If
  End If
  Called$ = "Y"
  Can$ = "N"
  If SurvForm.Check1.Value = 1 And SurvForm.Check2.Value = 1 Then
    Calib!(0) = Cal1
    Calib!(Swp%) = Cal2
  ElseIf SurvForm.Check1.Value = 1 Then
    Calib!(0) = Cal1
    Calib!(Swp%) = Cal1
  ElseIf SurvForm.Check2.Value = 1 Then
    Calib!(0) = Cal2
    Calib!(Swp%) = Cal2
  Else
    Calib!(0) = Val(Tx$)
    Calib!(Swp%) = Val(Tx$)
  End If
End Sub

Private Sub Command9_Click()
  CutSeg$ = "Y"
  If Down1$ <> "Y" Then
    Down1$ = "N"
  End If
  If Down2$ <> "Y" Then
    Down2$ = "N"
  End If

  If SelSeg$ = "Y" And Down3$ = "Y" Then
    SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture8.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture8.PSet (X, Y), QBColor(7)
      Else
        SurvForm.Picture8.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  End If
  If SelSeg$ = "Y" And Down4$ = "Y" Then
    SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture9.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture9.PSet (X, Y), QBColor(7)
      Else
        SurvForm.Picture9.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  End If
  SelSeg$ = "N"
  Down3$ = "N"
  Down4$ = "N"
End Sub

Private Sub Form_Load()
  If LoadData.Caption <> "New Survey" And LoadData.Caption <> "Open Survey" And LoadData.Caption <> "Open Image" Then

  If LCase$(Right$(LoadData.File1.filename, 4)) <> ".img" Then
    Karaleah.SaveSurveyMenu.Enabled = 0
    Karaleah.SaveAsSurveyMenu.Enabled = -1
    Karaleah.SweepSurveyMenu.Enabled = 0
    Karaleah.NameSurveyMenu.Enabled = -1
    Karaleah.SaveImageMenu.Enabled = 0
    Karaleah.SaveAsImageMenu.Enabled = 0
    Karaleah.SaveAsBitmapMenu.Enabled = 0
    Karaleah.ScaleImageMenu.Enabled = 0
    Karaleah.WindowImageMenu.Enabled = 0
    Karaleah.NameImageMenu.Enabled = 0
    Karaleah.AppendImageMenu.Enabled = 0
    Karaleah.BiColorImageMenu.Enabled = 0
    Karaleah.TriColorImageMenu.Enabled = 0
    Karaleah.SuperImageMenu.Enabled = 0
    Karaleah.PrintImageMenu.Enabled = 0
    Called$ = "N"
    For Num% = 1 To 1000
      Check%(Num%) = 0
    Next
    Mv$ = "N"
    Remake$ = "Y"
    Block$ = "N"
    For Num% = 1 To 80
      Calib!(Num%) = 0
    Next
    Pix% = 0
    BaseDeg = 0
    DeltaDec = 0
    BoxMem$ = "N"
    DataForm.Check1.Value = 1
  Else
    BoxMem$ = "N"
    Karaleah.SaveSurveyMenu.Enabled = 0
    Karaleah.SaveAsSurveyMenu.Enabled = 0
    Karaleah.SweepSurveyMenu.Enabled = 0
    Karaleah.NameSurveyMenu.Enabled = 0
    Karaleah.SaveImageMenu.Enabled = -1
    Karaleah.SaveAsImageMenu.Enabled = -1
    Karaleah.SaveAsBitmapMenu.Enabled = -1
    Karaleah.ScaleImageMenu.Enabled = -1
    Karaleah.WindowImageMenu.Enabled = -1
    Karaleah.NameImageMenu.Enabled = -1
    Karaleah.AppendImageMenu.Enabled = -1
    Karaleah.BiColorImageMenu.Enabled = -1
    Karaleah.TriColorImageMenu.Enabled = 0
    Karaleah.SuperImageMenu.Enabled = -1
    Karaleah.PrintImageMenu.Enabled = -1
    Block$ = "Y"
    DataForm.Check1.Value = 1
    Cross$ = "N"
  End If
  If LCase$(Right$(LoadData.File1.filename, 4)) = ".md2" Then
  
  Ld$ = "New"
  SurvForm.Label1.Caption = LoadData.Label4.Caption + "\" + LoadData.File1.filename
  Open LoadData.File1.filename For Input As #2
  Swp% = 0
  Total%(Swp%) = 0
  For Num% = 1 To 60
    Line Input #2, R$
    Line Input #2, Dc$
    Line Input #2, Flx$
    Ra!(Swp%, Num%) = Val(R$)
    Dec!(Swp%, Num%) = Val(Dc$)
    Flux!(Swp%, Num%) = Val(Flx$)
  Next
  Line Input #2, Junk$
  For Num% = 61 To 120
    Line Input #2, R$
    Line Input #2, Dc$
    Line Input #2, Flx$
    Ra!(Swp%, Num%) = Val(R$)
    Dec!(Swp%, Num%) = Val(Dc$)
    Flux!(Swp%, Num%) = Val(Flx$)
  Next
  Line Input #2, Junk$
  Swp% = 1
  Line Input #2, R$
  While R$ <> "*"
  
  MinFlux(Swp%) = 100
  MaxFlux(Swp%) = -100
  Num% = 1
  While R$ <> "*"
    Line Input #2, Dc$
    Line Input #2, Flx$
    Ra!(Swp%, Num%) = Val(R$)
    Dec!(Swp%, Num%) = Val(Dc$)
    Flux!(Swp%, Num%) = Val(Flx$)
    If Flux!(Swp%, Num%) < MinFlux(Swp%) Then
      MinFlux(Swp%) = Flux!(Swp%, Num%)
    End If
    If Flux!(Swp%, Num%) > MaxFlux(Swp%) Then
      MaxFlux(Swp%) = Flux!(Swp%, Num%)
    End If
    Num% = Num% + 1
    Line Input #2, R$
  Wend
  Total%(Swp%) = Num% - 1
  
  Swp% = Swp% + 1
  Line Input #2, R$
  Wend
  Swp% = Swp% - 1
  For Num% = 121 To 180
    Line Input #2, R$
    Line Input #2, Dc$
    Line Input #2, Flx$
    Ra!(0, Num%) = Val(R$)
    Dec!(0, Num%) = Val(Dc$)
    Flux!(0, Num%) = Val(Flx$)
  Next
  Line Input #2, Junk$
  For Num% = 181 To 240
    Line Input #2, R$
    Line Input #2, Dc$
    Line Input #2, Flx$
    Ra!(0, Num%) = Val(R$)
    Dec!(0, Num%) = Val(Dc$)
    Flux!(0, Num%) = Val(Flx$)
  Next
  Close #2
    
  If Ra!(0, 120) < Ra!(0, 1) Then
    Cross$ = "Y"
    Num% = 120
    While Ra!(0, Num%) >= Ra!(0, Num% - 1)
      Ra!(0, Num%) = Ra!(0, Num%) + 86400
      Num% = Num% - 1
    Wend
    Ra!(0, Num%) = Ra!(0, Num%) + 86400
  End If
  For Cnt% = 1 To 1
    If (Cross$ <> "Y") And (Ra!(Cnt%, Total%(Cnt%)) < Ra!(0, 120)) Then
      Cross$ = "Y"
      Num% = Total%(Cnt%)
      While (Ra!(Cnt%, Num%) >= Ra!(Cnt%, Num% - 1)) And (Num% > 1)
        Ra!(Cnt%, Num%) = Ra!(Cnt%, Num%) + 86400
        Num% = Num% - 1
      Wend
      Ra!(Cnt%, Num%) = Ra!(Cnt%, Num%) + 86400
    ElseIf Cross$ = "Y" Then
      For Num% = 1 To Total%(Cnt%)
        Ra!(Cnt%, Num%) = Ra!(Cnt%, Num%) + 86400
      Next
    End If
    If MaxFlux(Cnt%) = MinFlux(Cnt%) Then
      MaxFlux(Cnt%) = MaxFlux(Cnt%) + 0.5
      MinFlux(Cnt%) = MinFlux(Cnt%) - 0.5
    End If
  Next
  For Cnt% = 2 To Swp%
    If (Cross$ <> "Y") And (Ra!(Cnt%, Total%(Cnt%)) < Ra!(Cnt% - 1, Total%(Cnt% - 1))) Then
      Cross$ = "Y"
      Num% = Total%(Cnt%)
      While (Ra!(Cnt%, Num%) >= Ra!(Cnt%, Num% - 1)) And (Num% > 1)
        Ra!(Cnt%, Num%) = Ra!(Cnt%, Num%) + 86400
        Num% = Num% - 1
      Wend
      Ra!(Cnt%, Num%) = Ra!(Cnt%, Num%) + 86400
    ElseIf Cross$ = "Y" Then
      For Num% = 1 To Total%(Cnt%)
        Ra!(Cnt%, Num%) = Ra!(Cnt%, Num%) + 86400
      Next
    End If
    If MaxFlux(Cnt%) = MinFlux(Cnt%) Then
      MaxFlux(Cnt%) = MaxFlux(Cnt%) + 0.5
      MinFlux(Cnt%) = MinFlux(Cnt%) - 0.5
    End If
  Next
  If (Cross$ <> "Y") And (Ra!(0, 240) < Ra!(Swp%, Total%(Swp%))) Then
    Cross$ = "Y"
    Num% = 240
    While (Ra!(0, Num%) >= Ra!(0, Num% - 1)) And (Num% > 1)
      Ra!(0, Num%) = Ra!(0, Num%) + 86400
      Num% = Num% - 1
    Wend
    Ra!(0, Num%) = Ra!(0, Num%) + 86400
  ElseIf Cross$ = "Y" Then
    For Num% = 121 To 240
      Ra!(0, Num%) = Ra!(0, Num%) + 86400
    Next
  End If
  Length% = Len(LoadData.File1.filename)
  SurvForm.Caption = UCase$(Left$(LoadData.File1.filename, Length% - 4)) + " - Sweep 1"
  CurrentY = 810
  CurrentX = 180
  Print "F"
  CurrentX = 210
  Print "l"
  CurrentX = 180
  Print "u"
  CurrentX = 180
  Print "x"
  CurrentY = 3450
  CurrentX = 180
  Print "F"
  CurrentX = 210
  Print "l"
  CurrentX = 180
  Print "u"
  CurrentX = 180
  Print "x"
  CurrentY = 2430
  CurrentX = 3000
  Print "Declination"
  Show
  SurvForm.Refresh
  SwpCnt% = 1
  MinDec(SwpCnt%) = 1000
  MaxDec(SwpCnt%) = -1000
  For Cnt% = 1 To Int(Total%(SwpCnt%) / 6) - 1
    SumX = 0
    SumY = 0
    SumXX = 0
    SumXY = 0
    For Num% = (Cnt% - 1) * 6 + 1 To (Cnt% - 1) * 6 + 12
      SumX = SumX + Num%
      SumY = SumY + Dec!(SwpCnt%, Num%)
      SumXX = SumXX + Num% ^ 2
      SumXY = SumXY + Num% * Dec!(SwpCnt%, Num%)
    Next
    B = (12 * SumXY - SumX * SumY) / (12 * SumXX - SumX ^ 2)
    A = (SumY - B * SumX) / 12
    If Cnt% = 1 Then
      For Num% = (Cnt% - 1) * 6 + 1 To (Cnt% - 1) * 6 + 9
        Dec!(SwpCnt%, Num%) = B * Num% + A
        If Dec!(SwpCnt%, Num%) < MinDec(SwpCnt%) Then
          MinDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
        End If
        If Dec!(SwpCnt%, Num%) > MaxDec(SwpCnt%) Then
          MaxDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
        End If
      Next
    ElseIf Cnt% = Int(Total%(SwpCnt%) / 6) - 1 Then
      For Num% = (Cnt% - 1) * 6 + 4 To (Cnt% - 1) * 6 + 12
        Dec!(SwpCnt%, Num%) = B * Num% + A
        If Dec!(SwpCnt%, Num%) < MinDec(SwpCnt%) Then
          MinDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
        End If
        If Dec!(SwpCnt%, Num%) > MaxDec(SwpCnt%) Then
          MaxDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
        End If
      Next
    Else
      For Num% = (Cnt% - 1) * 6 + 4 To (Cnt% - 1) * 6 + 9
        Dec!(SwpCnt%, Num%) = B * Num% + A
        If Dec!(SwpCnt%, Num%) < MinDec(SwpCnt%) Then
          MinDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
        End If
        If Dec!(SwpCnt%, Num%) > MaxDec(SwpCnt%) Then
          MaxDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
        End If
      Next
    End If
  Next
  If Total%(SwpCnt%) = 6 Then
    For Num% = 1 To 6
      If Dec!(SwpCnt%, Num%) < MinDec(SwpCnt%) Then
        MinDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
      End If
      If Dec!(SwpCnt%, Num%) > MaxDec(SwpCnt%) Then
        MaxDec(SwpCnt%) = Dec!(SwpCnt%, Num%)
      End If
    Next
  End If
  If MinDec(SwpCnt%) = MaxDec(SwpCnt%) Then
    Dec!(SwpCnt%, Total%(SwpCnt%)) = Dec!(SwpCnt%, Total%(SwpCnt%)) + 0.01
  End If
  If Dec!(SwpCnt%, 1) > Dec!(SwpCnt%, Total%(SwpCnt%)) Then
    For Num% = 1 To Total%(SwpCnt%)
      Baseline!(Num%) = Dec!(SwpCnt%, Num%)
    Next
    For Num% = 1 To Total%(SwpCnt%)
      Dec!(SwpCnt%, Num%) = Baseline!(Total%(SwpCnt%) + 1 - Num%)
    Next
    For Num% = 1 To Total%(SwpCnt%)
      Baseline!(Num%) = Ra!(SwpCnt%, Num%)
    Next
    For Num% = 1 To Total%(SwpCnt%)
      Ra!(SwpCnt%, Num%) = Baseline!(Total%(SwpCnt%) + 1 - Num%)
    Next
    For Num% = 1 To Total%(SwpCnt%)
      Baseline!(Num%) = Flux!(SwpCnt%, Num%)
    Next
    For Num% = 1 To Total%(SwpCnt%)
      Flux!(SwpCnt%, Num%) = Baseline!(Total%(SwpCnt%) + 1 - Num%)
    Next
  End If
  For Number% = 1 To Total%(SwpCnt%) - 1
    For Num% = 1 To Total%(SwpCnt%) - 1
      If Dec!(SwpCnt%, Num% + 1) < Dec!(SwpCnt%, Num%) Then
        Dc$ = Str$(Dec!(SwpCnt%, Num%))
        Flx$ = Str$(Flux!(SwpCnt%, Num%))
        Dec!(SwpCnt%, Num%) = Dec!(SwpCnt%, Num% + 1)
        Flux!(SwpCnt%, Num%) = Flux!(SwpCnt%, Num% + 1)
        Dec!(SwpCnt%, Num% + 1) = Val(Dc$)
        Flux!(SwpCnt%, Num% + 1) = Val(Flx$)
      End If
    Next
  Next
  For Num% = 1 To Total%(SwpCnt%)
    Baseline!(Num%) = 0
  Next
  For Num% = 1 To Total%(SwpCnt%)
    X = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
    Y = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
    SurvForm.Picture2.Circle (X, Y), 15, QBColor(12)
  Next
  SurvForm.Refresh

  ElseIf LCase$(Right$(LoadData.File1.filename, 4)) = ".srv" Then
  
  Ld$ = "Open"
  Can$ = "Y"
  Karaleah.SaveSurveyMenu = -1
  SwpCnt% = 1
  Open LoadData.File1.filename For Input As #2
    Line Input #2, Junk$
    SurvForm.Label1.Caption = Junk$
    Line Input #2, Junk$
    SurvForm.Label2.Caption = Junk$
    Line Input #2, Junk$
    SwpCnt% = Val(Junk$)
    Line Input #2, Junk$
    Swp% = Val(Junk$)
    Line Input #2, Junk$
    Calib!(0) = Val(Junk$)
    Line Input #2, Junk$
    Calib!(Swp%) = Val(Junk$)
    For Num% = 1 To 240
      Line Input #2, Junk$
      Ra!(0, Num%) = Val(Junk$)
      Line Input #2, Junk$
      Dec!(0, Num%) = Val(Junk$)
      Line Input #2, Junk$
      Flux!(0, Num%) = Val(Junk$)
    Next
    For Cnt% = 1 To Swp%
      Line Input #2, Junk$
      MinDec(Cnt%) = Val(Junk$)
      Line Input #2, Junk$
      MaxDec(Cnt%) = Val(Junk$)
      Line Input #2, Junk$
      MinFlux(Cnt%) = Val(Junk$)
      Line Input #2, Junk$
      MaxFlux(Cnt%) = Val(Junk$)
      Line Input #2, Junk$
      Calib!(Cnt%) = Val(Junk$)
      Line Input #2, Junk$
      Total%(Cnt%) = Val(Junk$)
      For Num% = 1 To Total%(Cnt%)
        Line Input #2, Junk$
        Ra!(Cnt%, Num%) = Val(Junk$)
        Line Input #2, Junk$
        Dec!(Cnt%, Num%) = Val(Junk$)
        Line Input #2, Junk$
        Flux!(Cnt%, Num%) = Val(Junk$)
      Next
    Next
  Close #2
  If SwpCnt% > 1 Then
    Karaleah.SweepSurveyMenu.Enabled = -1
  End If
  If SwpCnt% <= Swp% Then
    SurvForm.Caption = SurvForm.Label2.Caption + " - Sweep" + Str$(SwpCnt%)
    CurrentY = 810
    CurrentX = 180
    Print "F"
    CurrentX = 210
    Print "l"
    CurrentX = 180
    Print "u"
    CurrentX = 180
    Print "x"
    CurrentY = 3450
    CurrentX = 180
    Print "F"
    CurrentX = 210
    Print "l"
    CurrentX = 180
    Print "u"
    CurrentX = 180
    Print "x"
    CurrentY = 2430
    CurrentX = 3000
    Print "Declination"
    Cnt% = SwpCnt%
    While (Calib!(Cnt%) = 0) And (Cnt% <= Swp%)
      Cnt% = Cnt% + 1
    Wend
    If (SwpCnt% = 1) And (Cnt% = Swp% + 1) Then
      SurvForm.Command1.Enabled = 0
    Else
      SurvForm.Command1.Enabled = -1
    End If
    Show
    SurvForm.Refresh
    For Num% = 1 To Total%(SwpCnt%)
      X = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      Y = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (X, Y), 15, QBColor(12)
    Next
    SurvForm.Refresh
  ElseIf SwpCnt% > Swp% Then
    SurvForm.Caption = SurvForm.Label2.Caption + " - Pre-Image"
    SurvForm.CurrentY = 1440
    SurvForm.CurrentX = 180
    SurvForm.Print "D"
    SurvForm.CurrentX = 180
    SurvForm.Print "e"
    SurvForm.CurrentX = 180
    SurvForm.Print "c"
    SurvForm.CurrentX = 210
    SurvForm.Print "l"
    SurvForm.CurrentX = 210
    SurvForm.Print "i"
    SurvForm.CurrentX = 180
    SurvForm.Print "n"
    SurvForm.CurrentX = 180
    SurvForm.Print "a"
    SurvForm.CurrentX = 210
    SurvForm.Print "t"
    SurvForm.CurrentX = 210
    SurvForm.Print "i"
    SurvForm.CurrentX = 180
    SurvForm.Print "o"
    SurvForm.CurrentX = 180
    SurvForm.Print "n"
    SurvForm.CurrentY = 5070
    SurvForm.CurrentX = 2760
    SurvForm.Print "Right Ascension"
    SurvForm.Command1.Enabled = -1
    SurvForm.Command1.Visible = 0
    SurvForm.Command2.Visible = 0
    SurvForm.Command3.Visible = 0
    SurvForm.Command4.Visible = 0
    SurvForm.Picture2.Visible = 0
    SurvForm.Picture3.Visible = 0
    SurvForm.Command12.Visible = -1
    SurvForm.Command13.Visible = -1
    SurvForm.Command14.Visible = -1
    SurvForm.Command15.Visible = -1
    SurvForm.Command5.Visible = -1
    SurvForm.Picture1.Visible = -1
    Show
    SurvForm.Refresh
    Called$ = "Y"
    SwpCnt% = Swp%
    MinDecPI = 1000
    MaxDecPI = -1000
    MinFluxPI = 100
    MaxFluxPI = -100
    For Num% = 1 To Swp%
      If MinDec(Num%) < MinDecPI Then
        MinDecPI = MinDec(Num%)
      End If
      If MaxDec(Num%) > MaxDecPI Then
        MaxDecPI = MaxDec(Num%)
      End If
      Cnt1% = Num% - 1
      While Calib!(Cnt1%) = 0
        Cnt1% = Cnt1% - 1
      Wend
      Cnt2% = Num%
      While Calib!(Cnt2%) = 0
        Cnt2% = Cnt2% + 1
      Wend
      Cal1 = (Num% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      Cal2 = (Num% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      If MinFlux(Num%) / (Cal1 + Cal2) * 2 < MinFluxPI Then
        MinFluxPI = MinFlux(Num%) / (Cal1 + Cal2) * 2
      End If
      If MaxFlux(Num%) / (Cal1 + Cal2) * 2 > MaxFluxPI Then
        MaxFluxPI = MaxFlux(Num%) / (Cal1 + Cal2) * 2
      End If
    Next
    MinRaPI = Ra!(1, 1)
    If Ra!(Swp%, 1) < Ra!(Swp%, Total%(Swp%)) Then
      MaxRaPI = Ra!(Swp%, Total%(Swp%))
    Else
      MaxRaPI = Ra!(Swp%, 1)
    End If
    For Cnt% = 1 To Swp%
      Cnt1% = Cnt% - 1
      While Calib!(Cnt1%) = 0
        Cnt1% = Cnt1% - 1
      Wend
      Cnt2% = Cnt%
      While Calib!(Cnt2%) = 0
        Cnt2% = Cnt2% + 1
      Wend
      Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
      If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
        If Cnt% = 1 Then
          X = 5970
        Else
          X = 5970 - ((Ra!(Cnt%, 1) + Ra!(Cnt% - 1, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
        If Cnt% = Swp% Then
          XTemp% = 0
        Else
          XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
      Else
        If Cnt% = 1 Then
          X = 5970
        Else
          X = 5970 - ((Ra!(Cnt%, Total%(Cnt%)) + Ra!(Cnt% - 1, Total%(Cnt% - 1))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
        If Cnt% = Swp% Then
          XTemp% = 0
        Else
          XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
        End If
      End If
      For Num% = 1 To Total%(Cnt%)
        Y = 4770 - (Dec!(Cnt%, Num%) - MinDecPI) / (MaxDecPI - MinDecPI) * 4770
        Color = Int((Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 255) + 1
        If Color = 256 Then
          Color = 255
        ElseIf Color < 1 Then
          Color = 1
        End If
        If Color <= 255 / 7 Then
          Red% = Color * 7
          Green% = 0
          Blue% = Color * 7
        ElseIf Color <= 255 * 2 / 7 Then
          Red% = 255 - (Color - 255 / 7) * 7
          Green% = 0
          Blue% = 255
        ElseIf Color <= 255 * 3 / 7 Then
          Red% = 0
          Green% = (Color - 255 * 2 / 7) * 7
          Blue% = 255
        ElseIf Color <= 255 * 4 / 7 Then
          Red% = 0
          Green% = 255
          Blue% = 255 - (Color - 255 * 3 / 7) * 7
        ElseIf Color <= 255 * 5 / 7 Then
          Red% = (Color - 255 * 4 / 7) * 7
          Green% = 255
          Blue% = 0
        ElseIf Color <= 255 * 6 / 7 Then
          Red% = 255
          Green% = 255 - (Color - 255 * 5 / 7) * 7
          Blue% = 0
        ElseIf Color <= 255 Then
          Red% = 255
          Green% = (Color - 255 * 6 / 7) * 7
          Blue% = (Color - 255 * 6 / 7) * 7
        End If
        SurvForm.Picture1.Line (X, Y - 15)-(XTemp%, Y + 15), RGB(Red%, Green%, Blue%), BF
      Next
      SurvForm.Refresh
    Next
  End If
  
  ElseIf LCase$(Right$(LoadData.File1.filename, 4)) = ".img" Then
    Open LoadData.File1.filename For Binary As #3
    Get #3, 1, Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    SurvForm.Label4.Caption = Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinRaI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxRaI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinDecI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxDecI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinFluxI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxFluxI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinRaPI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxRaPI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinDecPI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxDecPI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinFluxPI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxFluxPI = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Pix% = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    PalNum% = Val(Junk$)
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Get #3, , Length%
        Junk$ = String$(Length%, " ")
        Get #3, , Junk$
        Pal!(Cnt%, Num%) = Val(Junk$)
      Next
    Next
    Junk$ = Str$(MinFluxPI) + " " + Str$(MaxFluxPI) + " " + Str$(MinFluxI) + " " + Str$(MaxFluxI) + " " + Str$(PalNum%) + " "
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Junk$ = Junk$ + Str$(Pal!(Cnt%, Num%)) + " "
      Next
    Next
    SurvForm.Label8.Caption = Junk$
    If DataForm.Label1.Caption = "" Then
      DataForm.Label1.Caption = "*"
    Else
      DataForm.Label1.Caption = ""
    End If
    DataForm.Picture7.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture6.Line (0, 0)-(1650, 570), RGB(255, 255, 255), BF
    DataForm.Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    DataForm.Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    DataForm.Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    For Cnt% = 2 To PalNum%
      For Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) To Int((Pal!(Cnt%, 1) - 1) / 254 * 414)
        Red% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
        Green% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
        Blue% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
        DataForm.Picture1.Line (Num% * 15, 0)-(Num% * 15, 465), RGB(Red%, Green%, Blue%)
        Red% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 465
        Green% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 465
        Blue% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 465
        DataForm.Picture7.Line (Num% * 15, 465 - Red%)-(Num% * 15, 465), RGB(255, 0, 0)
        DataForm.Picture8.Line (Num% * 15, 465 - Green%)-(Num% * 15, 465), RGB(0, 255, 0)
        DataForm.Picture9.Line (Num% * 15, 465 - Blue%)-(Num% * 15, 465), RGB(0, 0, 255)
      Next
      Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    Next
    Num% = Int((Pal!(8, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    Junk$ = String$(1, " ")
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Get #3, , Length%
        Clr%(Num%, Cnt%) = Length%
      Next
    Next
    Close #3
    SurvForm.Caption = SurvForm.Label4.Caption + " - Image"
    SurvForm.CurrentY = 1440
    SurvForm.CurrentX = 180
    SurvForm.Print "D"
    SurvForm.CurrentX = 180
    SurvForm.Print "e"
    SurvForm.CurrentX = 180
    SurvForm.Print "c"
    SurvForm.CurrentX = 210
    SurvForm.Print "l"
    SurvForm.CurrentX = 210
    SurvForm.Print "i"
    SurvForm.CurrentX = 180
    SurvForm.Print "n"
    SurvForm.CurrentX = 180
    SurvForm.Print "a"
    SurvForm.CurrentX = 210
    SurvForm.Print "t"
    SurvForm.CurrentX = 210
    SurvForm.Print "i"
    SurvForm.CurrentX = 180
    SurvForm.Print "o"
    SurvForm.CurrentX = 180
    SurvForm.Print "n"
    SurvForm.CurrentY = 5070
    SurvForm.CurrentX = 2760
    SurvForm.Print "Right Ascension"
    SurvForm.Command1.Visible = 0
    SurvForm.Command2.Visible = 0
    SurvForm.Command3.Visible = 0
    SurvForm.Command4.Visible = 0
    SurvForm.Command6.Visible = -1
    SurvForm.Picture2.Visible = 0
    SurvForm.Picture3.Visible = 0
    SurvForm.Picture4.Visible = -1
    SurvForm.Picture5.Visible = -1
    Show
    SurvForm.Refresh
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        If Clr%(Num%, Cnt%) <> 0 Then

        Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
        If Color >= 256 Then
          Color = 255
        ElseIf Color < 1 Then
          Color = 1
        End If
        CntCnt% = 1
        While (Color > (Pal!(CntCnt%, 1) - 1) / 254 * 255) And (CntCnt% < PalNum%)
          CntCnt% = CntCnt% + 1
        Wend
        Red% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 2) - Pal!(CntCnt% - 1, 2)) + Pal!(CntCnt% - 1, 2)
        Green% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 3) - Pal!(CntCnt% - 1, 3)) + Pal!(CntCnt% - 1, 3)
        Blue% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 4) - Pal!(CntCnt% - 1, 4)) + Pal!(CntCnt% - 1, 4)
        SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
        End If
      Next
      SurvForm.Refresh
    Next
  End If

  End If
End Sub

Private Sub Label11_Click()

End Sub

Private Sub Label6_Change()
  If Box$ = "Y" Then
    XTmp = Val(SurvForm.Label7.Caption) / 2 / (MaxRaI - MinRaI) * 240 * 5970
    YTmp = Val(SurvForm.Label7.Caption) / 2 / (MaxDecI - MinDecI) * 4770
    Num1% = Int((XOld - XTmp) / 15 / Pix% + 1)
    Num2% = Int((XOld + XTmp) / 15 / Pix% + 1)
    Cnt1% = Int((YOld - YTmp) / 15 / Pix% + 1)
    Cnt2% = Int((YOld + YTmp) / 15 / Pix% + 1)
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    For Num% = Num1% To Num2%
      For Cnt% = Cnt1% To Cnt1% + 1
        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% >= 1) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clrrr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
      For Cnt% = Cnt2% To Cnt2% + 1
        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clrrr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
    Next
    For Cnt% = Cnt1% To Cnt2%
      For Num% = Num1% To Num1% + 1
        If (Num% >= 1) And (Cnt% >= 1) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clrrr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
      For Num% = Num2% To Num2% + 1
        If (Num% <= XMax%) And (Cnt% >= 1) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clrrr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
    Next
    SurvForm.Refresh
  End If
Exit Sub

Clrrr:
  If Color >= 256 Then
    Color = 255
  ElseIf Color < 1 Then
    Color = 1
  End If
  CntCnt% = 1
  While (Color > (Pal!(CntCnt%, 1) - 1) / 254 * 255) And (CntCnt% < PalNum%)
    CntCnt% = CntCnt% + 1
  Wend
  Red% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 2) - Pal!(CntCnt% - 1, 2)) + Pal!(CntCnt% - 1, 2)
  Green% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 3) - Pal!(CntCnt% - 1, 3)) + Pal!(CntCnt% - 1, 3)
  Blue% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 4) - Pal!(CntCnt% - 1, 4)) + Pal!(CntCnt% - 1, 4)
  Return
End Sub

Private Sub Label8_Change()
  Picture5.Line (0, 0)-(1815, 1815), RGB(255, 255, 255), BF
  BoxMem$ = "N"
  SurvForm.FontTransparent = 0
  SurvForm.CurrentY = 4680
  SurvForm.CurrentX = 6720
  SurvForm.Print "                       "
  SurvForm.CurrentX = 6720
  SurvForm.Print "                       "
  SurvForm.CurrentX = 6720
  SurvForm.Print "                                   "
  SurvForm.FontTransparent = -1
  Remake$ = "Y"
  Junk$ = SurvForm.Label8.Caption
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  Tempo$ = ""
  While Left$(Junk$, 1) <> " "
    Tempo$ = Tempo$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  MinFluxPI = Val(Tempo$)
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  Tempo$ = ""
  While Left$(Junk$, 1) <> " "
    Tempo$ = Tempo$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  MaxFluxPI = Val(Tempo$)
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  Tempo$ = ""
  While Left$(Junk$, 1) <> " "
    Tempo$ = Tempo$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  MinFluxI = Val(Tempo$)
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  Tempo$ = ""
  While Left$(Junk$, 1) <> " "
    Tempo$ = Tempo$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  MaxFluxI = Val(Tempo$)
  Length% = Len(Junk$)
  Junk$ = Right$(Junk$, Length% - 2)
  Tempo$ = ""
  While Left$(Junk$, 1) <> " "
    Tempo$ = Tempo$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  PalNum% = Val(Tempo$)
  Length% = Len(Junk$)
  Junk$ = Right$(Junk$, Length% - 2)
  For Cnt% = 1 To PalNum%
    For Num% = 1 To 4
      Tempo$ = ""
      While Left$(Junk$, 1) <> " "
        Tempo$ = Tempo$ + Left$(Junk$, 1)
        Length% = Len(Junk$)
        Junk$ = Right$(Junk$, Length% - 1)
      Wend
      Pal!(Cnt%, Num%) = Val(Tempo$)
      Length% = Len(Junk$)
      If (Cnt% <> PalNum%) Or (Num% <> 4) Then
        Junk$ = Right$(Junk$, Length% - 2)
      End If
    Next
  Next
  If Label9.Caption = "Y" Then
    Label9.Caption = "N"
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        If Clr%(Num%, Cnt%) <> 0 Then

        Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
        If Color >= 256 Then
          Color = 255
        ElseIf Color < 1 Then
          Color = 1
        End If
        CntCnt% = 1
        While (Color > (Pal!(CntCnt%, 1) - 1) / 254 * 255) And (CntCnt% < PalNum%)
          CntCnt% = CntCnt% + 1
        Wend
        Red% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 2) - Pal!(CntCnt% - 1, 2)) + Pal!(CntCnt% - 1, 2)
        Green% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 3) - Pal!(CntCnt% - 1, 3)) + Pal!(CntCnt% - 1, 3)
        Blue% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 4) - Pal!(CntCnt% - 1, 4)) + Pal!(CntCnt% - 1, 4)
        SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
        End If
      Next
      SurvForm.Refresh
    Next
  End If
End Sub

Private Sub Picture1_GotFocus()
  If LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Then
    Open LoadData.Text1.Text For Output As #3
    Print #3, SurvForm.Label1.Caption
    Print #3, SurvForm.Label2.Caption
    Print #3, Swp% + 1
    Print #3, Swp%
    Print #3, Format$(Calib!(0), "#.####")
    Print #3, Format$(Calib!(Swp%), "#.####")
    For Num% = 1 To 240
      Print #3, Ra!(0, Num%)
      Print #3, Format$(Dec!(0, Num%), "#.##")
      Print #3, Format$(Flux!(0, Num%), "#.####")
    Next
    For Cnt% = 1 To Swp%
      Print #3, Format$(MinDec(Cnt%), "#.##")
      Print #3, Format$(MaxDec(Cnt%), "#.##")
      Print #3, Format$(MinFlux(Cnt%), "#.####")
      Print #3, Format$(MaxFlux(Cnt%), "#.####")
      Print #3, Format$(Calib!(Cnt%), "#.####")
      Print #3, Total%(Cnt%)
      For Num% = 1 To Total%(Cnt%)
        Print #3, Ra!(Cnt%, Num%)
        Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
        Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
      Next
    Next
    Close #3
    If LoadData.Caption = "save" Then
      SurvForm.Label3.Caption = LoadData.Label4.Caption + "\" + LoadData.Text1.Text
    End If
    Karaleah.SaveSurveyMenu.Enabled = -1
  ElseIf LoadData.Caption = "sweep" Then
    If Mv$ <> "Y" Then
      SwpCntMv% = SwpCnt% + 1
      CalledMv$ = Called$
    End If
    Junk$ = InputBox$("Sweep Number (1 - " + Str$(SwpCntMv% - 1) + ") :", "Input Sweep Number", Str$(SwpCntMv% - 1))
    If Val(Junk$) < 1 Or Val(Junk$) >= SwpCntMv% Or Val(Junk$) <> Int(Val(Junk$)) Then
      MsgBox "Invalid Sweep Number", 48, "Error Message"
    Else
      Mv$ = "Y"
      Karaleah.SaveSurveyMenu.Enabled = 0
      Karaleah.SaveAsSurveyMenu.Enabled = 0
      SwpCnt% = Val(Junk$)
      Called$ = "Y"
      Can$ = "N"
      Cal$ = "Y"
      SurvForm.FontTransparent = 0
      SurvForm.CurrentY = 1440
      SurvForm.CurrentX = 180
      SurvForm.Print "  "
      SurvForm.CurrentX = 180
      SurvForm.Print "  "
      SurvForm.CurrentX = 180
      SurvForm.Print "  "
      SurvForm.CurrentX = 210
      SurvForm.Print "  "
      SurvForm.CurrentX = 210
      SurvForm.Print "  "
      SurvForm.CurrentX = 180
      SurvForm.Print "  "
      SurvForm.CurrentX = 180
      SurvForm.Print "  "
      SurvForm.CurrentX = 210
      SurvForm.Print "  "
      SurvForm.CurrentX = 210
      SurvForm.Print "  "
      SurvForm.CurrentX = 180
      SurvForm.Print "  "
      SurvForm.CurrentX = 180
      SurvForm.Print "  "
      SurvForm.CurrentY = 5070
      SurvForm.CurrentX = 2760
      Print "                        "
      CurrentY = 4680
      CurrentX = 6720
      Print "                       "
      CurrentX = 6720
      Print "                       "
      CurrentX = 6720
      Print "                       "
      SurvForm.FontTransparent = -1
      SurvForm.Caption = SurvForm.Label2.Caption + " - Sweep" + Str$(SwpCnt%)
      CurrentY = 810
      CurrentX = 180
      Print "F"
      CurrentX = 210
      Print "l"
      CurrentX = 180
      Print "u"
      CurrentX = 180
      Print "x"
      CurrentY = 3450
      CurrentX = 180
      Print "F"
      CurrentX = 210
      Print "l"
      CurrentX = 180
      Print "u"
      CurrentX = 180
      Print "x"
      CurrentY = 2430
      CurrentX = 3000
      Print "Declination"
      SurvForm.Command5.Visible = 0
      SurvForm.Command12.Visible = 0
      SurvForm.Command13.Visible = 0
      SurvForm.Command14.Visible = 0
      SurvForm.Command15.Visible = 0
      SurvForm.Picture1.Visible = 0
      SurvForm.Command1.Enabled = -1
      SurvForm.Command1.Visible = -1
      SurvForm.Command1.SetFocus
      SurvForm.Command2.Visible = -1
      SurvForm.Command3.Visible = -1
      SurvForm.Command4.Visible = -1
      SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
      SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
      SurvForm.Picture2.Visible = -1
      SurvForm.Picture3.Visible = -1
      SurvForm.Refresh
      For Num% = 1 To Total%(SwpCnt%)
        X = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
        Y = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
        SurvForm.Picture2.Circle (X, Y), 15, QBColor(12)
      Next
      SurvForm.Refresh
    End If
  End If
  If LoadData.Caption <> "show" Then
    Unload LoadData
  End If
  If SurvForm.Command12.Visible = -1 Then
    SurvForm.Command12.SetFocus
  End If
End Sub

Private Sub Picture1_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  X = (5970 - X) / 5970 * (MaxRaPI - MinRaPI) + MinRaPI
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                                   "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  Y = (4770 - Y) / 4770 * (MaxDecPI - MinDecPI) + MinDecPI
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
  Cnt% = 1
  If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
    If Cnt% = Swp% Then
      XTemp% = 0
    Else
      XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
  Else
    If Cnt% = Swp% Then
      XTemp% = 0
    Else
      XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
    End If
  End If
  XTmp = (5970 - XTemp%) / 5970 * (MaxRaPI - MinRaPI) + MinRaPI
  While XTmp < X
    Cnt% = Cnt% + 1
    If Ra!(Cnt%, 1) < Ra!(Cnt%, Total%(Cnt%)) Then
      If Cnt% = Swp% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, Total%(Cnt% + 1)) + Ra!(Cnt%, Total%(Cnt%))) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    Else
      If Cnt% = Swp% Then
        XTemp% = 0
      Else
        XTemp% = 5970 - ((Ra!(Cnt% + 1, 1) + Ra!(Cnt%, 1)) / 2 - MinRaPI) / (MaxRaPI - MinRaPI) * 5970
      End If
    End If
    XTmp = (5970 - XTemp%) / 5970 * (MaxRaPI - MinRaPI) + MinRaPI
  Wend
  If (Y >= MinDec(Cnt%)) And (Y <= MaxDec(Cnt%)) Then
    Num% = 1
    While (Dec!(Cnt%, Num%) < Y)
      Num% = Num% + 1
    Wend
    Cnt1% = Cnt% - 1
    While Calib!(Cnt1%) = 0
      Cnt1% = Cnt1% - 1
    Wend
      Cnt2% = Cnt%
    While Calib!(Cnt2%) = 0
      Cnt2% = Cnt2% + 1
    Wend
    Cal1 = (Cnt% - 1 - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Cal2 = (Cnt% - Cnt1%) / (Cnt2% - Cnt1%) * (Calib!(Cnt2%) - Calib!(Cnt1%)) + Calib!(Cnt1%)
    Print "Flux: ";
    Y = Flux!(Cnt%, Num%) / (Cal1 + Cal2) * 2
    If DataForm.CalSlope.Caption <> "" Then
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
    If DataForm.CalSlope.Caption <> "" Then
      Print " Jy"
    End If
  End If
  SurvForm.Refresh
End Sub

Private Sub Picture2_GotFocus()
  Button% = 0
  If LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Or LoadData.Caption = "sweep" Or LoadData.Caption = "renew" Or LoadData.Caption = "renew2" Then
    Button% = 1
    If (Pict3$ = "Y") And (LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Or LoadData.Caption = "sweep") Then
      Opt% = 1 Or 48
      Button% = MsgBox("Changes To Sweep Will Be Discarded", Opt%, "Status Message")
    End If
  End If
  If Button% = 1 Then
     
  If (Pict3$ = "Y") And (LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Or LoadData.Caption = "sweep") Then
    MinFlux(SwpCnt%) = 100
    MaxFlux(SwpCnt%) = -100
    For Num% = 1 To Total%(SwpCnt%)
      Flux!(SwpCnt%, Num%) = Flux!(SwpCnt%, Num%) + Baseline!(Num%)
      Baseline!(Num%) = 0
      If Flux!(SwpCnt%, Num%) < MinFlux(SwpCnt%) Then
        MinFlux(SwpCnt%) = Flux!(SwpCnt%, Num%)
      End If
      If Flux!(SwpCnt%, Num%) > MaxFlux(SwpCnt%) Then
        MaxFlux(SwpCnt%) = Flux!(SwpCnt%, Num%)
      End If
    Next
    BaseSeg$ = "N"
    Pict3$ = "N"
    Down2$ = "N"
    Down3$ = "N"
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
    For Num% = 1 To Total%(SwpCnt%)
      XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      YTemp% = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(12)
    Next
    SurvForm.Refresh
  ElseIf Pict3$ = "Y" Then
    For Num% = 1 To Total%(SwpCnt%)
      Baseline!(Num%) = 0
    Next
    BaseSeg$ = "N"
    Pict3$ = "N"
    Down2$ = "N"
    Down3$ = "N"
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Refresh
  End If

  If LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Then
    Open LoadData.Text1.Text For Output As #3
    Print #3, SurvForm.Label1.Caption
    Print #3, SurvForm.Label2.Caption
    Print #3, SwpCnt%
    Print #3, Swp%
    Print #3, Format$(Calib!(0), "#.####")
    Print #3, Format$(Calib!(Swp%), "#.####")
    For Num% = 1 To 240
      Print #3, Ra!(0, Num%)
      Print #3, Format$(Dec!(0, Num%), "#.##")
      Print #3, Format$(Flux!(0, Num%), "#.####")
    Next
    For Cnt% = 1 To Swp%
      Print #3, Format$(MinDec(Cnt%), "#.##")
      Print #3, Format$(MaxDec(Cnt%), "#.##")
      Print #3, Format$(MinFlux(Cnt%), "#.####")
      Print #3, Format$(MaxFlux(Cnt%), "#.####")
      Print #3, Format$(Calib!(Cnt%), "#.####")
      Print #3, Total%(Cnt%)
      For Num% = 1 To Total%(Cnt%)
        Print #3, Ra!(Cnt%, Num%)
        Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
        Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
      Next
    Next
    Close #3
    If LoadData.Caption = "save" Then
      SurvForm.Label3.Caption = LoadData.Label4.Caption + "\" + LoadData.Text1.Text
    End If
    Karaleah.SaveSurveyMenu.Enabled = -1
  ElseIf LoadData.Caption = "sweep" Then
    If Mv$ <> "Y" Then
      SwpCntMv% = SwpCnt%
      CalledMv$ = Called$
    End If
    Junk$ = InputBox$("Sweep Number (1 - " + Str$(SwpCntMv% - 1) + ") :", "Input Sweep Number", Str$(SwpCntMv% - 1))
    If Val(Junk$) < 1 Or Val(Junk$) >= SwpCntMv% Or Val(Junk$) <> Int(Val(Junk$)) Then
      MsgBox "Invalid Sweep Number", 48, "Error Message"
    Else
      Num% = 1
      While Baseline!(Num%) = 0 And Num% <= Total%(SwpCnt%)
        Num% = Num% + 1
      Wend
      Button% = 1
      If Num% <> Total%(SwpCnt%) + 1 Then
        Opt% = 1 Or 48
        Button% = MsgBox("Changes To Sweep Will Be Discarded", Opt%, "Status Message")
      End If
      If Button% = 1 Then
        For Num% = 1 To Total%(SwpCnt%)
          Flux!(SwpCnt%, Num%) = Flux!(SwpCnt%, Num%) + Baseline!(Num%)
        Next
        Mv$ = "Y"
        Karaleah.SaveSurveyMenu.Enabled = 0
        Karaleah.SaveAsSurveyMenu.Enabled = 0
        SwpCnt% = Val(Junk$)
        Called$ = "Y"
        Can$ = "N"
        Cal$ = "Y"
        SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
        SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
        SurvForm.Caption = SurvForm.Label2.Caption + " - Sweep" + Str$(SwpCnt%)
        SurvForm.FontTransparent = 0
        CurrentY = 2430
        CurrentX = 2760
        Print "                        "
        SurvForm.FontTransparent = -1
        CurrentY = 2430
        CurrentX = 3000
        Print "Declination"
        SurvForm.Command1.Enabled = -1
        SurvForm.Command1.SetFocus
        SurvForm.Refresh
        For Num% = 1 To Total%(SwpCnt%)
          X = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
          Y = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
          SurvForm.Picture2.Circle (X, Y), 15, QBColor(12)
        Next
        SurvForm.Refresh
      End If
    End If
  End If

  End If
  If LoadData.Caption <> "show" Then
    Unload LoadData
  End If
End Sub

Private Sub Picture2_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If BaseSeg$ = "Y" And Down2$ = "N" And Button = 1 Then
    Down2$ = "Y"
    XBeg% = X
    YBeg% = Y
    If Pict3$ = "Y" Then
      Down3$ = "N"
      SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
      For Num% = 1 To Total%(SwpCnt%)
        XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
        YTemp% = 2130 - (Baseline!(Num%) - MinFluxB) / (MaxFluxB - MinFluxB) * 2130
        SurvForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(9)
      Next
      SurvForm.Refresh
    End If
  ElseIf BaseSeg$ = "Y" And Down2$ = "Y" And Button = 2 Then
    Down2$ = "N"
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    For Num% = 1 To Total%(SwpCnt%)
      XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      YTemp% = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(12)
    Next
    SurvForm.Refresh
  ElseIf BaseSeg$ = "Y" And Down2$ = "Y" And Button = 1 Then
    XPlus = X / 5970 * (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) + MinDec(SwpCnt%)
    YPlus = (2130 - Y) / 2130 * (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) + MinFlux(SwpCnt%)
    X = (X - XBeg%) / 5970 * (MaxDec(SwpCnt%) - MinDec(SwpCnt%))
    Y = (YBeg% - Y) / 2130 * (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%))
    If X <> 0 Then

    B = YPlus - Y / X * (XPlus - MinDec(SwpCnt%))
    MinMem = MinFlux(SwpCnt%)
    MaxMem = MaxFlux(SwpCnt%)
    MinFlux(SwpCnt%) = 100
    MaxFlux(SwpCnt%) = -100
    MinFluxB = 100
    MaxFluxB = -100
    For Num% = 1 To Total%(SwpCnt%)
      If Abs(Dec!(SwpCnt%, Num%) - XPlus) <= Abs(X) And Abs(Dec!(SwpCnt%, Num%) - XPlus + X) <= Abs(X) Then
        Baseline!(Num%) = Baseline!(Num%) + Flux!(SwpCnt%, Num%) - Y / X * (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) - B
        Flux!(SwpCnt%, Num%) = Y / X * (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) + B
      End If
      If Flux!(SwpCnt%, Num%) < MinFlux(SwpCnt%) Then
        MinFlux(SwpCnt%) = Flux!(SwpCnt%, Num%)
      End If
      If Flux!(SwpCnt%, Num%) > MaxFlux(SwpCnt%) Then
        MaxFlux(SwpCnt%) = Flux!(SwpCnt%, Num%)
      End If
      If Baseline!(Num%) < MinFluxB Then
        MinFluxB = Baseline!(Num%)
      End If
      If Baseline!(Num%) > MaxFluxB Then
        MaxFluxB = Baseline!(Num%)
      End If
    Next
    If MinFlux(SwpCnt%) = 100 Or MaxFlux(SwpCnt%) = -100 Then
      MinFlux(SwpCnt%) = MinMem
      MaxFlux(SwpCnt%) = MaxMem
    ElseIf MinFlux(SwpCnt%) = MaxFlux(SwpCnt%) Then
      MinFlux(SwpCnt%) = MinFlux(SwpCnt%) - 0.5
      MaxFlux(SwpCnt%) = MaxFlux(SwpCnt%) + 0.5
    End If
    Pict3$ = "Y"
    If MinFluxB = 100 Or MaxFluxB = -100 Then
      Pict3$ = "N"
    ElseIf MinFluxB = MaxFluxB Then
      MinFluxB = MinFluxB - 0.5
      MaxFluxB = MaxFluxB + 0.5
    End If
    Down2$ = "N"
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
    For Num% = 1 To Total%(SwpCnt%)
      XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      YTemp% = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(12)
      If Pict3$ = "Y" Then
        YTemp% = 2130 - (Baseline!(Num%) - MinFluxB) / (MaxFluxB - MinFluxB) * 2130
        SurvForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh

    End If
  End If
End Sub

Private Sub Picture2_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If BaseSeg$ = "Y" And Down2$ = "Y" Then
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Picture2.Line (XBeg%, YBeg%)-(X, Y), QBColor(13)
    For Num% = 1 To Total%(SwpCnt%)
      XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      YTemp% = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(12)
    Next
    SurvForm.Refresh
  Else
  
  X = X / 5970 * (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) + MinDec(SwpCnt%)
  If X > MaxDec(SwpCnt%) Then
    X = MaxDec(SwpCnt%)
  End If
  Num% = 1
  While Dec!(SwpCnt%, Num%) < X
    Num% = Num% + 1
  Wend
  Hrs% = Int(Ra!(SwpCnt%, Num%) / 3600)
  Mins% = Int((Ra!(SwpCnt%, Num%) - Hrs% * 3600!) / 60)
  Secs% = Int(Ra!(SwpCnt%, Num%) - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                                   "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  Hrs% = Int(Abs(X))
  Mins% = Int((Abs(X) - Hrs%) * 60)
  Secs% = Int((Abs(X) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If X < 0 Then
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
  Y = (2130 - Y) / 2130 * (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) + MinFlux(SwpCnt%)
  Cnt% = SwpCnt%
  While (Calib!(Cnt%) = 0) And (Cnt% <= Swp%)
    Cnt% = Cnt% + 1
  Wend
  If Cnt% < Swp% + 1 Then
    Num% = SwpCnt% - 1
    While Calib!(Num%) = 0
      Num% = Num% - 1
    Wend
    Cal1 = (SwpNum% - Num%) / (Cnt% - Num%) * (Calib!(Cnt%) - Calib!(Num%)) + Calib!(Num%)
    Cal2 = (SwpNum% - 1 - Num%) / (Cnt% - Num%) * (Calib!(Cnt%) - Calib!(Num%)) + Calib!(Num%)
    Y = Y / (Cal1 + Cal2) * 2
    If DataForm.CalSlope.Caption <> "" Then
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
    If DataForm.CalSlope.Caption <> "" Then
      Print " Jy"
    End If
  Else
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
  End If
  SurvForm.Refresh

  End If
End Sub

Private Sub Picture3_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If Pict3$ = "Y" Then

  If BaseSeg$ = "Y" And Down3$ = "N" And Button = 1 Then
    Down3$ = "Y"
    XBeg% = X
    YBeg% = Y
    Down2$ = "N"
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    For Num% = 1 To Total%(SwpCnt%)
      XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      YTemp% = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(12)
    Next
    SurvForm.Refresh
  ElseIf BaseSeg$ = "Y" And Down3$ = "Y" And Button = 2 Then
    Down3$ = "N"
    SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
    For Num% = 1 To Total%(SwpCnt%)
      XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      YTemp% = 2130 - (Baseline!(Num%) - MinFluxB) / (MaxFluxB - MinFluxB) * 2130
      SurvForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(9)
    Next
    SurvForm.Refresh
  ElseIf BaseSeg$ = "Y" And Down3$ = "Y" And Button = 1 Then
    XPlus = X / 5970 * (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) + MinDec(SwpCnt%)
    YPlus = (2130 - Y) / 2130 * (MaxFluxB - MinFluxB) + MinFluxB
    X = (X - XBeg%) / 5970 * (MaxDec(SwpCnt%) - MinDec(SwpCnt%))
    Y = (YBeg% - Y) / 2130 * (MaxFluxB - MinFluxB)
    If X <> 0 Then

    B = YPlus - Y / X * (XPlus - MinDec(SwpCnt%))
    MinMem = MinFlux(SwpCnt%)
    MaxMem = MaxFlux(SwpCnt%)
    MinFlux(SwpCnt%) = 100
    MaxFlux(SwpCnt%) = -100
    MinFluxB = 100
    MaxFluxB = -100
    For Num% = 1 To Total%(SwpCnt%)
      If Abs(Dec!(SwpCnt%, Num%) - XPlus) <= Abs(X) And Abs(Dec!(SwpCnt%, Num%) - XPlus + X) <= Abs(X) Then
        Flux!(SwpCnt%, Num%) = Flux!(SwpCnt%, Num%) + Baseline!(Num%) - Y / X * (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) - B
        Baseline!(Num%) = Y / X * (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) + B
      End If
      If Flux!(SwpCnt%, Num%) < MinFlux(SwpCnt%) Then
        MinFlux(SwpCnt%) = Flux!(SwpCnt%, Num%)
      End If
      If Flux!(SwpCnt%, Num%) > MaxFlux(SwpCnt%) Then
        MaxFlux(SwpCnt%) = Flux!(SwpCnt%, Num%)
      End If
      If Baseline!(Num%) < MinFluxB Then
        MinFluxB = Baseline!(Num%)
      End If
      If Baseline!(Num%) > MaxFluxB Then
        MaxFluxB = Baseline!(Num%)
      End If
    Next
    If MinFlux(SwpCnt%) = 100 Or MaxFlux(SwpCnt%) = -100 Then
      MinFlux(SwpCnt%) = MinMem
      MaxFlux(SwpCnt%) = MaxMem
    ElseIf MinFlux(SwpCnt%) = MaxFlux(SwpCnt%) Then
      MinFlux(SwpCnt%) = MinFlux(SwpCnt%) - 0.5
      MaxFlux(SwpCnt%) = MaxFlux(SwpCnt%) + 0.5
    End If
    If MinFluxB = 100 Or MaxFluxB = -100 Then
      Pict3$ = "N"
    ElseIf MinFluxB = MaxFluxB Then
      MinFluxB = MinFluxB - 0.5
      MaxFluxB = MaxFluxB + 0.5
    End If
    Down3$ = "N"
    SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
    For Num% = 1 To Total%(SwpCnt%)
      XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      YTemp% = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
      SurvForm.Picture2.Circle (XTemp%, YTemp%), 15, QBColor(12)
      If Pict3$ = "Y" Then
        YTemp% = 2130 - (Baseline!(Num%) - MinFluxB) / (MaxFluxB - MinFluxB) * 2130
        SurvForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh

    End If
  End If

  End If
End Sub

Private Sub Picture3_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If BaseSeg$ = "Y" And Down3$ = "Y" Then
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
    SurvForm.Picture3.Line (XBeg%, YBeg%)-(X, Y), QBColor(13)
    For Num% = 1 To Total%(SwpCnt%)
      XTemp% = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
      YTemp% = 2130 - (Baseline!(Num%) - MinFluxB) / (MaxFluxB - MinFluxB) * 2130
      SurvForm.Picture3.Circle (XTemp%, YTemp%), 15, QBColor(9)
    Next
    SurvForm.Refresh
  ElseIf Pict3$ = "Y" Then
  
  X = X / 5970 * (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) + MinDec(SwpCnt%)
  If X > MaxDec(SwpCnt%) Then
    X = MaxDec(SwpCnt%)
  End If
  Num% = 1
  While Dec!(SwpCnt%, Num%) < X
    Num% = Num% + 1
  Wend
  Hrs% = Int(Ra!(SwpCnt%, Num%) / 3600)
  Mins% = Int((Ra!(SwpCnt%, Num%) - Hrs% * 3600!) / 60)
  Secs% = Int(Ra!(SwpCnt%, Num%) - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
    Print "                                "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  Hrs% = Int(Abs(X))
  Mins% = Int((Abs(X) - Hrs%) * 60)
  Secs% = Int((Abs(X) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If X < 0 Then
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
  Y = (2130 - Y) / 2130 * (MaxFluxB - MinFluxB) + MinFluxB
  Cnt% = SwpCnt%
  While (Calib!(Cnt%) = 0) And (Cnt% <= Swp%)
    Cnt% = Cnt% + 1
  Wend
  If Cnt% < Swp% + 1 Then
    Num% = SwpCnt% - 1
    While Calib!(Num%) = 0
      Num% = Num% - 1
    Wend
    Cal1 = (SwpNum% - Num%) / (Cnt% - Num%) * (Calib!(Cnt%) - Calib!(Num%)) + Calib!(Num%)
    Cal2 = (SwpNum% - 1 - Num%) / (Cnt% - Num%) * (Calib!(Cnt%) - Calib!(Num%)) + Calib!(Num%)
    Y = Y / (Cal1 + Cal2) * 2
    If DataForm.CalSlope.Caption <> "" Then
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
    If DataForm.CalSlope.Caption <> "" Then
      Print " Jy"
    End If
  Else
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
  End If
  SurvForm.Refresh

  End If
End Sub

Private Sub Picture4_GotFocus()
  If LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Then
    Open LoadData.Text1.Text For Output As #3
    Close #3
    Open LoadData.Text1.Text For Binary As #3
    Length% = Len(SurvForm.Label4.Caption)
    Put #3, 1, Length%
    Junk$ = SurvForm.Label4.Caption
    Put #3, , Junk$
    Length% = Len(Str$(MinRaI))
    Put #3, , Length%
    Junk$ = Str$(MinRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecI))
    Put #3, , Length%
    Junk$ = Str$(MinDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxI)
    Put #3, , Junk$
    Length% = Len(Str$(MinRaPI))
    Put #3, , Length%
    Junk$ = Str$(MinRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxRaPI))
    Put #3, , Length%
    Junk$ = Str$(MaxRaPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinDecPI))
    Put #3, , Length%
    Junk$ = Str$(MinDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxDecPI))
    Put #3, , Length%
    Junk$ = Str$(MaxDecPI)
    Put #3, , Junk$
    Length% = Len(Str$(MinFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MinFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(MaxFluxPI))
    Put #3, , Length%
    Junk$ = Str$(MaxFluxPI)
    Put #3, , Junk$
    Length% = Len(Str$(Pix%))
    Put #3, , Length%
    Junk$ = Str$(Pix%)
    Put #3, , Junk$
    Length% = Len(Str$(PalNum%))
    Put #3, , Length%
    Junk$ = Str$(PalNum%)
    Put #3, , Junk$
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Length% = Len(Str$(Pal!(Cnt%, Num%)))
        Put #3, , Length%
        Junk$ = Str$(Pal!(Cnt%, Num%))
        Put #3, , Junk$
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Length% = Clr%(Num%, Cnt%)
        Put #3, , Length%
      Next
    Next
    Close #3
    If LoadData.Caption = "save" Then
      SurvForm.Label5.Caption = LoadData.Label4.Caption + "\" + LoadData.Text1.Text
    End If
    Karaleah.SaveImageMenu.Enabled = -1
  ElseIf LoadData.Caption = "bicolor" Then
    Tempted$ = LoadData.File1.filename
    Col1$ = InputBox$("Initial Image Color (Red, Green, or Blue):", "Input Initial Image Color", "Red")
    If (Col1$ <> "Red") And (Col1$ <> "red") And (Col1$ <> "RED") And (Col1$ <> "r") And (Col1$ <> "R") And (Col1$ <> "Green") And (Col1$ <> "green") And (Col1$ <> "GREEN") And (Col1$ <> "g") And (Col1$ <> "G") And (Col1$ <> "Blue") And (Col1$ <> "blue") And (Col1$ <> "BLUE") And (Col1$ <> "b") And (Col1$ <> "B") Then
      Qt$ = "Y"
      MsgBox "Invalid Color Selection", 48, "Error Message"
    End If
    If Qt <> "Y" Then
      Col2$ = InputBox$("Second Image Color (Red, Green, or Blue):", "Input Second Image Color", "Green")
      If ((Col2$ <> "Red") And (Col2$ <> "red") And (Col2$ <> "RED") And (Col2$ <> "r") And (Col2$ <> "R") And (Col2$ <> "Green") And (Col2$ <> "green") And (Col2$ <> "GREEN") And (Col2$ <> "g") And (Col2$ <> "G") And (Col2$ <> "Blue") And (Col2$ <> "blue") And (Col2$ <> "BLUE") And (Col2$ <> "b") And (Col2$ <> "B")) Or (((Col1$ = "Red") Or (Col1$ = "red") Or (Col1$ = "RED") Or (Col1$ = "r") Or (Col1$ = "R")) And ((Col2$ = "Red") Or (Col2$ = "red") Or (Col2$ = "RED") Or (Col2$ = "r") Or (Col2$ = "R"))) Or (((Col1$ = "Green") Or (Col1$ = "green") Or (Col1$ = "GREEN") Or (Col1$ = "g") Or (Col1$ = "G")) And ((Col2$ = "Green") Or (Col2$ = "green") Or (Col2$ = "GREEN") Or (Col2$ = "g") Or (Col2$ = "G"))) Or (((Col1$ = "Blue") Or (Col1$ = "blue") Or (Col1$ = "BLUE") Or (Col1$ = "b") Or (Col1$ = "B")) And ((Col2$ = "Blue") Or (Col2$ = "blue") Or (Col2$ = "BLUE") Or (Col2$ = "b") Or (Col2$ = "B"))) Then
        Qt$ = "Y"
        MsgBox "Invalid Color Selection", 48, "Error Message"
      End If
    End If
    Col4$ = Col1$
    Col5$ = Col2$
    If Qt$ <> "Y" Then
      Opt% = 3 Or 32
      Button% = MsgBox("Both Images Use the Same Calibration?", Opt%, "Make Bi-Color Image")
      'Button% = 6
      If Button% = 2 Then
        Qt$ = "Y"
      ElseIf Button% = 7 Then
        If DataForm.CalSlope.Caption = "" Then
          Qt$ = "Y"
          MsgBox "Select Initial Image Calibration", , "Make Bi-Color Image"
        Else
          Length% = Len(DataForm.CalSlope.Caption)
          Cal1 = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
          Load LoadData
          LoadData.Caption = "Select Second Image Calibration"
          LoadData.Label2.Caption = "*.cal"
          LoadData.Label4.Caption = LoadData.Dir1.Path
          LoadData.File1.Pattern = "*.cal"
          LoadData.Show 1
          If LoadData.Caption = "okay" Then
            Open LoadData.File1.filename For Input As #1
            Line Input #1, Junk$
            Line Input #1, Junk$
            If Junk$ = "" Then
              Qt$ = "Y"
            Else
              Length% = Len(Junk$)
              Cal2 = Val(Mid$(Junk$, 8, Length% - 10))
              scl = Cal1 / Cal2
            End If
            Close #1
            Unload LoadData
          Else
            Qt$ = "Y"
            Unload LoadData
          End If
        End If
      Else
        scl = 1
      End If
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Opt% = 3 Or 32 Or 256
    Button% = MsgBox("Shift Second Image?", Opt%, "Make Bi-Color Image")
    If Button% = 2 Then
      Qt$ = "Y"
    ElseIf Button% = 6 Then
      DelRa$ = ""
      DelRa$ = InputBox$("Right Ascension Shift (Minutes):", "Input Right Ascension Shift", "0")
      If DelRa$ = "" Then
        Qt$ = "Y"
        MsgBox "Invalid Right Ascension Shift", 48, "Error Message"
      End If
      If Qt$ <> "Y" Then
        DelDec$ = ""
        DelDec$ = InputBox$("Declination Shift (Degrees):", "Input Degress Shift", "0")
        If DelDec$ = "" Then
          Qt$ = "Y"
          MsgBox "Invalid Declination Shift", 48, "Error Message"
        End If
      End If
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Index$ = ""
    Index$ = InputBox$("Palette Index:", "Input Palette Index", Str$(1))
    If (Val(Index$) <= 0) Then
      MsgBox "Invalid Palette Index", 48, "Error Message"
    End If
    Indy = Val(Index$)
    Pix1% = Pix%
    Dc$ = ""
    Dc$ = InputBox$("Pixel Resolution (Pixels):", "Input Pixel Resolution", Str$(1))
    If (Val(Dc$) - Int(Val(Dc$)) <> 0) Or (Val(Dc$) <= 0) Then
      MsgBox "Invalid Pixel Resolution", 48, "Error Message"
    Else

    Pix% = Val(Dc$)
    BoxMem$ = "N"
    DataForm.Check1.Value = 1
    Karaleah.SaveImageMenu.Enabled = 0
    Open Tempted$ For Binary As #3
    Get #3, 1, Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    SurvForm.Label4.Caption = SurvForm.Label4.Caption + " - " + Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    If Val(Junk$) < MinRaI Then
      MinRaI = Val(Junk$)
    End If
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinRaPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxRaPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinDecPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxDecPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinFluxPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxFluxPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Pix2% = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    PalNum% = Val(Junk$)
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Get #3, , Length%
        Junk$ = String$(Length%, " ")
        Get #3, , Junk$
        Pal!(Cnt%, Num%) = Val(Junk$)
      Next
    Next
    PalNum% = 8
    Pal!(1, 1) = 1
    Pal!(1, 2) = 0
    Pal!(1, 3) = 0
    Pal!(1, 4) = 0
    Pal!(2, 1) = 255 / 7
    Pal!(2, 2) = 255
    Pal!(2, 3) = 0
    Pal!(2, 4) = 255
    Pal!(3, 1) = 255 * 2 / 7
    Pal!(3, 2) = 0
    Pal!(3, 3) = 0
    Pal!(3, 4) = 255
    Pal!(4, 1) = 255 * 3 / 7
    Pal!(4, 2) = 0
    Pal!(4, 3) = 255
    Pal!(4, 4) = 255
    Pal!(5, 1) = 255 * 4 / 7
    Pal!(5, 2) = 0
    Pal!(5, 3) = 255
    Pal!(5, 4) = 0
    Pal!(6, 1) = 255 * 5 / 7
    Pal!(6, 2) = 255
    Pal!(6, 3) = 255
    Pal!(6, 4) = 0
    Pal!(7, 1) = 255 * 6 / 7
    Pal!(7, 2) = 255
    Pal!(7, 3) = 0
    Pal!(7, 4) = 0
    Pal!(8, 1) = 255
    Pal!(8, 2) = 255
    Pal!(8, 3) = 255
    Pal!(8, 4) = 255
    MinRaPI2 = Int(MinRaPI2 + 60 * Val(DelRa$))
    MaxRaPI2 = Int(MaxRaPI2 + 60 * Val(DelRa$))
    MinDecPI2 = MinDecPI2 + Val(DelDec$)
    MaxDecPI2 = MaxDecPI2 + Val(DelDec$)
    MinRaPI1 = MinRaPI
    MaxRaPI1 = MaxRaPI
    MinDecPI1 = MinDecPI
    MaxDecPI1 = MaxDecPI
    MinFluxPI1 = MinFluxPI * scl
    MaxFluxPI1 = MaxFluxPI * scl
    If (MaxRaPI1 > 43200) Or (MaxRaPI2 > 43200) Then
      If MaxRaPI1 < 43200 Then
        MinRaPI1 = MinRaPI1 + 86400
        MaxRaPI1 = MaxRaPI1 + 86400
      End If
      If MaxRaPI2 < 43200 Then
        MinRaPI2 = MinRaPI2 + 86400
        MaxRaPI2 = MaxRaPI2 + 86400
      End If
    End If
    If MinRaPI1 < MinRaPI2 Then
      MinRaPI = MinRaPI1
    Else
      MinRaPI = MinRaPI2
    End If
    If MaxRaPI1 > MaxRaPI2 Then
      MaxRaPI = MaxRaPI1
    Else
      MaxRaPI = MaxRaPI2
    End If
    If MinDecPI1 < MinDecPI2 Then
      MinDecPI = MinDecPI1
    Else
      MinDecPI = MinDecPI2
    End If
    If MaxDecPI1 > MaxDecPI2 Then
      MaxDecPI = MaxDecPI1
    Else
      MaxDecPI = MaxDecPI2
    End If
    If MinFluxPI1 < MinFluxPI2 Then
      MinFluxPI = MinFluxPI1
    Else
      MinFluxPI = MinFluxPI2
    End If
    If MaxFluxPI1 > MaxFluxPI2 Then
      MaxFluxPI = MaxFluxPI1
    Else
      MaxFluxPI = MaxFluxPI2
    End If
    SurvForm.Picture4.Line (0, 0)-(5970, 4770), QBColor(15), BF
    SurvForm.Picture5.Line (0, 0)-(1815, 1815), RGB(255, 255, 255), BF
    SurvForm.Caption = SurvForm.Label4.Caption + " - Bi-Color Image"
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                   "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    ReDim Clr2%(399, 319)
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Decc = (Int(4770 / 15 / Pix%) - Cnt% + 1) / Int(4770 / 15 / Pix%) * (MaxDecPI - MinDecPI) + MinDecPI
        Raa = (Int(5970 / 15 / Pix%) - Num% + 1) / Int(5970 / 15 / Pix%) * (MaxRaPI - MinRaPI) + MinRaPI
        If (Decc > MinDecPI1) And (Decc < MaxDecPI1) And (Raa > MinRaPI1) And (Raa < MaxRaPI1) Then
          Decc = Int(4770 / 15 / Pix1%) + 1 - (Decc - MinDecPI1) / (MaxDecPI1 - MinDecPI1) * Int(4770 / 15 / Pix1%)
          Raa = Int(5970 / 15 / Pix1%) + 1 - (Raa - MinRaPI1) / (MaxRaPI1 - MinRaPI1) * Int(5970 / 15 / Pix1%)
          If Clr%(Raa, Decc) <> 0 Then
            Clr2%(Num%, Cnt%) = ((Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
            Clr4%(Num%, Cnt%) = Clr2%(Num%, Cnt%)
          End If
        End If
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr%(Num%, Cnt%) = 0
      Next
    Next
    Junk$ = String$(1, " ")
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Get #3, , Length%
        Clr%(Num%, Cnt%) = Length%
      Next
    Next
    ReDim Clr3%(399, 319)
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Decc = (Int(4770 / 15 / Pix%) - Cnt% + 1) / Int(4770 / 15 / Pix%) * (MaxDecPI - MinDecPI) + MinDecPI
        Raa = (Int(5970 / 15 / Pix%) - Num% + 1) / Int(5970 / 15 / Pix%) * (MaxRaPI - MinRaPI) + MinRaPI
        If (Decc > MinDecPI2) And (Decc < MaxDecPI2) And (Raa > MinRaPI2) And (Raa < MaxRaPI2) Then
          Decc = Int(4770 / 15 / Pix2%) + 1 - (Decc - MinDecPI2) / (MaxDecPI2 - MinDecPI2) * Int(4770 / 15 / Pix2%)
          Raa = Int(5970 / 15 / Pix2%) + 1 - (Raa - MinRaPI2) / (MaxRaPI2 - MinRaPI2) * Int(5970 / 15 / Pix2%)
          If Clr%(Raa, Decc) <> 0 Then
            Clr3%(Num%, Cnt%) = ((Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
            Clr5%(Num%, Cnt%) = Clr3%(Num%, Cnt%)
          End If
        End If
      Next
    Next
    MinDecPI = Val(Format$(MinDecPI, "#.##"))
    MaxDecPI = Val(Format$(MaxDecPI, "#.##"))
    MinFluxPI = Val(Format$(MinFluxPI, "#.####"))
    MaxFluxPI = Val(Format$(MaxFluxPI, "#.####"))
    MinRaI = MinRaPI
    MaxRaI = MaxRaPI
    MinDecI = MinDecPI
    MaxDecI = MaxDecPI
    MinFluxI = MinFluxPI
    MaxFluxI = MaxFluxPI
    Junk$ = Str$(MinFluxPI) + " " + Str$(MaxFluxPI) + " " + Str$(MinFluxI) + " " + Str$(MaxFluxI) + " " + Str$(PalNum%) + " "
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Junk$ = Junk$ + Str$(Pal!(Cnt%, Num%)) + " "
      Next
    Next
    SurvForm.Label8.Caption = Junk$
    If DataForm.Label1.Caption = "" Then
      DataForm.Label1.Caption = "*"
    Else
      DataForm.Label1.Caption = ""
    End If
    DataForm.Picture7.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    Picture6.Line (0, 0)-(1650, 570), RGB(255, 255, 255), BF
    Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    For Cnt% = 2 To PalNum%
      For Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) To Int((Pal!(Cnt%, 1) - 1) / 254 * 414)
        Red% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
        Green% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
        Blue% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
        DataForm.Picture1.Line (Num% * 15, 0)-(Num% * 15, 465), RGB(Red%, Green%, Blue%)
        Red% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 465
        Green% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 465
        Blue% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 465
        DataForm.Picture7.Line (Num% * 15, 465 - Red%)-(Num% * 15, 465), RGB(255, 0, 0)
        DataForm.Picture8.Line (Num% * 15, 465 - Green%)-(Num% * 15, 465), RGB(0, 255, 0)
        DataForm.Picture9.Line (Num% * 15, 465 - Blue%)-(Num% * 15, 465), RGB(0, 0, 255)
      Next
      Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    Next
    Num% = Int((Pal!(8, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        If (Clr2%(Num%, Cnt%) <> 0) And (Clr3%(Num%, Cnt%) <> 0) Then
          Clr%(Num%, Cnt%) = (Clr2%(Num%, Cnt%) + Clr3%(Num%, Cnt%)) / 2
        ElseIf (Clr2%(Num%, Cnt%) = 0) And (Clr3%(Num%, Cnt%) <> 0) Then
          Clr%(Num%, Cnt%) = Clr3%(Num%, Cnt%)
        ElseIf (Clr2%(Num%, Cnt%) <> 0) And (Clr3%(Num%, Cnt%) = 0) Then
          Clr%(Num%, Cnt%) = Clr2%(Num%, Cnt%)
        Else
          Clr%(Num%, Cnt%) = 0
        End If
        Box$ = "N"
        If Clr%(Num%, Cnt%) <> 0 Then
          Color1 = Int(((Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
          If Color1 >= 256 Then
            Color1 = 255
          ElseIf Color1 < 1 Then
            Color1 = 1
          End If
          Color2 = Int(((Clr3%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
          If Color2 >= 256 Then
            Color2 = 255
          ElseIf Color2 < 1 Then
            Color2 = 1
          End If
          If ((Col1$ = "Red") Or (Col1$ = "red") Or (Col1$ = "RED") Or (Col1$ = "r") Or (Col1$ = "R")) And ((Col2$ = "Green") Or (Col2$ = "green") Or (Col2$ = "GREEN") Or (Col2$ = "g") Or (Col2$ = "G")) Then
            Red% = Color1
            Green% = Color2
            Blue% = 1
          ElseIf ((Col1$ = "Red") Or (Col1$ = "red") Or (Col1$ = "RED") Or (Col1$ = "r") Or (Col1$ = "R")) And ((Col2$ = "Blue") Or (Col2$ = "blue") Or (Col2$ = "BLUE") Or (Col2$ = "b") Or (Col2$ = "B")) Then
            Red% = Color1
            Blue% = Color2
            Green% = 1
          ElseIf ((Col1$ = "Green") Or (Col1$ = "green") Or (Col1$ = "GREEN") Or (Col1$ = "g") Or (Col1$ = "G")) And ((Col2$ = "Blue") Or (Col2$ = "blue") Or (Col2$ = "BLUE") Or (Col2$ = "b") Or (Col2$ = "B")) Then
            Green% = Color1
            Blue% = Color2
            Red% = 1
          ElseIf ((Col1$ = "Green") Or (Col1$ = "green") Or (Col1$ = "GREEN") Or (Col1$ = "g") Or (Col1$ = "G")) And ((Col2$ = "Red") Or (Col2$ = "red") Or (Col2$ = "RED") Or (Col2$ = "r") Or (Col2$ = "R")) Then
            Green% = Color1
            Red% = Color2
            Blue% = 1
          ElseIf ((Col1$ = "Blue") Or (Col1$ = "blue") Or (Col1$ = "BLUE") Or (Col1$ = "b") Or (Col1$ = "B")) And ((Col2$ = "Red") Or (Col2$ = "red") Or (Col2$ = "RED") Or (Col2$ = "r") Or (Col2$ = "R")) Then
            Blue% = Color1
            Red% = Color2
            Green% = 1
          ElseIf ((Col1$ = "Blue") Or (Col1$ = "blue") Or (Col1$ = "BLUE") Or (Col1$ = "b") Or (Col1$ = "B")) And ((Col2$ = "Green") Or (Col2$ = "green") Or (Col2$ = "GREEN") Or (Col2$ = "g") Or (Col2$ = "G")) Then
            Blue% = Color1
            Green% = Color2
            Red% = 1
          End If
          Red% = Int(255 * (Red% / 255) ^ Indy)
          Green% = Int(255 * (Green% / 255) ^ Indy)
          Blue% = Int(255 * (Blue% / 255) ^ Indy)
          SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
        End If
      Next
      SurvForm.Refresh
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr2%(Num%, Cnt%) = 0
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr3%(Num%, Cnt%) = 0
      Next
    Next
    Erase Clr2%
    Erase Clr3%
    Close #3
    Karaleah.BiColorImageMenu.Enabled = 0
    Karaleah.TriColorImageMenu.Enabled = -1
    
    End If
  ElseIf LoadData.Caption = "tricolor" Then
    Tempted$ = LoadData.File1.filename
    If Qt$ <> "Y" Then
      Opt% = 3 Or 32
      Button% = MsgBox("Both Images Use the Same Calibration?", Opt%, "Make Tri-Color Image")
      'Button% = 6
      If Button% = 2 Then
        Qt$ = "Y"
      ElseIf Button% = 7 Then
        If DataForm.CalSlope.Caption = "" Then
          Qt$ = "Y"
          MsgBox "Select Initial Image Calibration", , "Make Tri-Color Image"
        Else
          Length% = Len(DataForm.CalSlope.Caption)
          Cal1 = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
          Load LoadData
          LoadData.Caption = "Select Third Image Calibration"
          LoadData.Label2.Caption = "*.cal"
          LoadData.Label4.Caption = LoadData.Dir1.Path
          LoadData.File1.Pattern = "*.cal"
          LoadData.Show 1
          If LoadData.Caption = "okay" Then
            Open LoadData.File1.filename For Input As #1
            Line Input #1, Junk$
            Line Input #1, Junk$
            If Junk$ = "" Then
              Qt$ = "Y"
            Else
              Length% = Len(Junk$)
              Cal2 = Val(Mid$(Junk$, 8, Length% - 10))
              scl = Cal1 / Cal2
            End If
            Close #1
            Unload LoadData
          Else
            Qt$ = "Y"
            Unload LoadData
          End If
        End If
      Else
        scl = 1
      End If
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Opt% = 3 Or 32 Or 256
    Button% = MsgBox("Shift Third Image?", Opt%, "Make Tri-Color Image")
    If Button% = 2 Then
      Qt$ = "Y"
    ElseIf Button% = 6 Then
      DelRa$ = ""
      DelRa$ = InputBox$("Right Ascension Shift (Minutes):", "Input Right Ascension Shift", "0")
      If DelRa$ = "" Then
        Qt$ = "Y"
        MsgBox "Invalid Right Ascension Shift", 48, "Error Message"
      End If
      If Qt$ <> "Y" Then
        DelDec$ = ""
        DelDec$ = InputBox$("Declination Shift (Degrees):", "Input Degress Shift", "0")
        If DelDec$ = "" Then
          Qt$ = "Y"
          MsgBox "Invalid Declination Shift", 48, "Error Message"
        End If
      End If
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Pix1% = Pix%
    Dc$ = ""
    Dc$ = InputBox$("Pixel Resolution (Pixels):", "Input Pixel Resolution", Str$(1))
    If (Val(Dc$) - Int(Val(Dc$)) <> 0) Or (Val(Dc$) <= 0) Then
      MsgBox "Invalid Pixel Resolution", 48, "Error Message"
    Else

    Pix% = Val(Dc$)
    BoxMem$ = "N"
    DataForm.Check1.Value = 1
    Karaleah.SaveImageMenu.Enabled = 0
    Open Tempted$ For Binary As #3
    Get #3, 1, Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    SurvForm.Label4.Caption = SurvForm.Label4.Caption + " - " + Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    If Val(Junk$) < MinRaI Then
      MinRaI = Val(Junk$)
    End If
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinRaPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxRaPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinDecPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxDecPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinFluxPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxFluxPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Pix2% = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    PalNum% = Val(Junk$)
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Get #3, , Length%
        Junk$ = String$(Length%, " ")
        Get #3, , Junk$
        Pal!(Cnt%, Num%) = Val(Junk$)
      Next
    Next
    PalNum% = 8
    Pal!(1, 1) = 1
    Pal!(1, 2) = 0
    Pal!(1, 3) = 0
    Pal!(1, 4) = 0
    Pal!(2, 1) = 255 / 7
    Pal!(2, 2) = 255
    Pal!(2, 3) = 0
    Pal!(2, 4) = 255
    Pal!(3, 1) = 255 * 2 / 7
    Pal!(3, 2) = 0
    Pal!(3, 3) = 0
    Pal!(3, 4) = 255
    Pal!(4, 1) = 255 * 3 / 7
    Pal!(4, 2) = 0
    Pal!(4, 3) = 255
    Pal!(4, 4) = 255
    Pal!(5, 1) = 255 * 4 / 7
    Pal!(5, 2) = 0
    Pal!(5, 3) = 255
    Pal!(5, 4) = 0
    Pal!(6, 1) = 255 * 5 / 7
    Pal!(6, 2) = 255
    Pal!(6, 3) = 255
    Pal!(6, 4) = 0
    Pal!(7, 1) = 255 * 6 / 7
    Pal!(7, 2) = 255
    Pal!(7, 3) = 0
    Pal!(7, 4) = 0
    Pal!(8, 1) = 255
    Pal!(8, 2) = 255
    Pal!(8, 3) = 255
    Pal!(8, 4) = 255
    MinRaPI2 = Int(MinRaPI2 + 60 * Val(DelRa$))
    MaxRaPI2 = Int(MaxRaPI2 + 60 * Val(DelRa$))
    MinDecPI2 = MinDecPI2 + Val(DelDec$)
    MaxDecPI2 = MaxDecPI2 + Val(DelDec$)
    MinRaPI1 = MinRaPI
    MaxRaPI1 = MaxRaPI
    MinDecPI1 = MinDecPI
    MaxDecPI1 = MaxDecPI
    MinFluxPI1 = MinFluxPI * scl
    MaxFluxPI1 = MaxFluxPI * scl
    If (MaxRaPI1 > 43200) Or (MaxRaPI2 > 43200) Then
      If MaxRaPI1 < 43200 Then
        MinRaPI1 = MinRaPI1 + 86400
        MaxRaPI1 = MaxRaPI1 + 86400
      End If
      If MaxRaPI2 < 43200 Then
        MinRaPI2 = MinRaPI2 + 86400
        MaxRaPI2 = MaxRaPI2 + 86400
      End If
    End If
    If MinRaPI1 < MinRaPI2 Then
      MinRaPI = MinRaPI1
    Else
      MinRaPI = MinRaPI2
    End If
    If MaxRaPI1 > MaxRaPI2 Then
      MaxRaPI = MaxRaPI1
    Else
      MaxRaPI = MaxRaPI2
    End If
    If MinDecPI1 < MinDecPI2 Then
      MinDecPI = MinDecPI1
    Else
      MinDecPI = MinDecPI2
    End If
    If MaxDecPI1 > MaxDecPI2 Then
      MaxDecPI = MaxDecPI1
    Else
      MaxDecPI = MaxDecPI2
    End If
    If MinFluxPI1 < MinFluxPI2 Then
      MinFluxPI = MinFluxPI1
    Else
      MinFluxPI = MinFluxPI2
    End If
    If MaxFluxPI1 > MaxFluxPI2 Then
      MaxFluxPI = MaxFluxPI1
    Else
      MaxFluxPI = MaxFluxPI2
    End If
    SurvForm.Picture4.Line (0, 0)-(5970, 4770), QBColor(15), BF
    SurvForm.Picture5.Line (0, 0)-(1815, 1815), RGB(255, 255, 255), BF
    SurvForm.Caption = SurvForm.Label4.Caption + " - Tri-Color Image"
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                   "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    ReDim Clr2%(399, 319)
    ReDim Clr6%(399, 319)
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Decc = (Int(4770 / 15 / Pix%) - Cnt% + 1) / Int(4770 / 15 / Pix%) * (MaxDecPI - MinDecPI) + MinDecPI
        Raa = (Int(5970 / 15 / Pix%) - Num% + 1) / Int(5970 / 15 / Pix%) * (MaxRaPI - MinRaPI) + MinRaPI
        If (Decc > MinDecPI1) And (Decc < MaxDecPI1) And (Raa > MinRaPI1) And (Raa < MaxRaPI1) Then
          Decc = Int(4770 / 15 / Pix1%) + 1 - (Decc - MinDecPI1) / (MaxDecPI1 - MinDecPI1) * Int(4770 / 15 / Pix1%)
          Raa = Int(5970 / 15 / Pix1%) + 1 - (Raa - MinRaPI1) / (MaxRaPI1 - MinRaPI1) * Int(5970 / 15 / Pix1%)
          If Clr%(Raa, Decc) <> 0 Then
            Clr2%(Num%, Cnt%) = ((Clr4%(Raa, Decc) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
            Clr6%(Num%, Cnt%) = ((Clr5%(Raa, Decc) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
          End If
        End If
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr%(Num%, Cnt%) = 0
      Next
    Next
    Junk$ = String$(1, " ")
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Get #3, , Length%
        Clr%(Num%, Cnt%) = Length%
      Next
    Next
    ReDim Clr3%(399, 319)
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Decc = (Int(4770 / 15 / Pix%) - Cnt% + 1) / Int(4770 / 15 / Pix%) * (MaxDecPI - MinDecPI) + MinDecPI
        Raa = (Int(5970 / 15 / Pix%) - Num% + 1) / Int(5970 / 15 / Pix%) * (MaxRaPI - MinRaPI) + MinRaPI
        If (Decc > MinDecPI2) And (Decc < MaxDecPI2) And (Raa > MinRaPI2) And (Raa < MaxRaPI2) Then
          Decc = Int(4770 / 15 / Pix2%) + 1 - (Decc - MinDecPI2) / (MaxDecPI2 - MinDecPI2) * Int(4770 / 15 / Pix2%)
          Raa = Int(5970 / 15 / Pix2%) + 1 - (Raa - MinRaPI2) / (MaxRaPI2 - MinRaPI2) * Int(5970 / 15 / Pix2%)
          If Clr%(Raa, Decc) <> 0 Then
            Clr3%(Num%, Cnt%) = ((Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
          End If
        End If
      Next
    Next
    MinDecPI = Val(Format$(MinDecPI, "#.##"))
    MaxDecPI = Val(Format$(MaxDecPI, "#.##"))
    MinFluxPI = Val(Format$(MinFluxPI, "#.####"))
    MaxFluxPI = Val(Format$(MaxFluxPI, "#.####"))
    MinRaI = MinRaPI
    MaxRaI = MaxRaPI
    MinDecI = MinDecPI
    MaxDecI = MaxDecPI
    MinFluxI = MinFluxPI
    MaxFluxI = MaxFluxPI
    Junk$ = Str$(MinFluxPI) + " " + Str$(MaxFluxPI) + " " + Str$(MinFluxI) + " " + Str$(MaxFluxI) + " " + Str$(PalNum%) + " "
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Junk$ = Junk$ + Str$(Pal!(Cnt%, Num%)) + " "
      Next
    Next
    SurvForm.Label8.Caption = Junk$
    If DataForm.Label1.Caption = "" Then
      DataForm.Label1.Caption = "*"
    Else
      DataForm.Label1.Caption = ""
    End If
    DataForm.Picture7.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    Picture6.Line (0, 0)-(1650, 570), RGB(255, 255, 255), BF
    Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    For Cnt% = 2 To PalNum%
      For Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) To Int((Pal!(Cnt%, 1) - 1) / 254 * 414)
        Red% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
        Green% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
        Blue% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
        DataForm.Picture1.Line (Num% * 15, 0)-(Num% * 15, 465), RGB(Red%, Green%, Blue%)
        Red% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 465
        Green% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 465
        Blue% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 465
        DataForm.Picture7.Line (Num% * 15, 465 - Red%)-(Num% * 15, 465), RGB(255, 0, 0)
        DataForm.Picture8.Line (Num% * 15, 465 - Green%)-(Num% * 15, 465), RGB(0, 255, 0)
        DataForm.Picture9.Line (Num% * 15, 465 - Blue%)-(Num% * 15, 465), RGB(0, 0, 255)
      Next
      Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    Next
    Num% = Int((Pal!(8, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        If (Clr2%(Num%, Cnt%) <> 0) And (Clr3%(Num%, Cnt%) <> 0) And (Clr6%(Num%, Cnt%) <> 0) Then
          Clr%(Num%, Cnt%) = (Clr2%(Num%, Cnt%) + Clr3%(Num%, Cnt%) + Clr6%(Num%, Cnt%)) / 3
        ElseIf (Clr2%(Num%, Cnt%) = 0) And (Clr3%(Num%, Cnt%) <> 0) And (Clr6%(Num%, Cnt%) <> 0) Then
          Clr%(Num%, Cnt%) = (Clr3%(Num%, Cnt%) + Clr6%(Num%, Cnt%)) / 2
        ElseIf (Clr2%(Num%, Cnt%) <> 0) And (Clr3%(Num%, Cnt%) = 0) And (Clr6%(Num%, Cnt%) <> 0) Then
          Clr%(Num%, Cnt%) = (Clr2%(Num%, Cnt%) + Clr6%(Num%, Cnt%)) / 2
        ElseIf (Clr2%(Num%, Cnt%) <> 0) And (Clr3%(Num%, Cnt%) <> 0) And (Clr6%(Num%, Cnt%) = 0) Then
          Clr%(Num%, Cnt%) = (Clr2%(Num%, Cnt%) + Clr3%(Num%, Cnt%)) / 2
        ElseIf (Clr2%(Num%, Cnt%) <> 0) And (Clr3%(Num%, Cnt%) = 0) And (Clr6%(Num%, Cnt%) = 0) Then
          Clr%(Num%, Cnt%) = Clr2%(Num%, Cnt%)
        ElseIf (Clr2%(Num%, Cnt%) = 0) And (Clr3%(Num%, Cnt%) <> 0) And (Clr6%(Num%, Cnt%) = 0) Then
          Clr%(Num%, Cnt%) = Clr3%(Num%, Cnt%)
        ElseIf (Clr2%(Num%, Cnt%) = 0) And (Clr3%(Num%, Cnt%) = 0) And (Clr6%(Num%, Cnt%) <> 0) Then
          Clr%(Num%, Cnt%) = Clr6%(Num%, Cnt%)
        Else
          Clr%(Num%, Cnt%) = 0
        End If
        Box$ = "N"
        If Clr%(Num%, Cnt%) <> 0 Then
          Color1 = Int(((Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
          If Color1 >= 256 Then
            Color1 = 255
          ElseIf Color1 < 1 Then
            Color1 = 1
          End If
          Color2 = Int(((Clr6%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
          If Color2 >= 256 Then
            Color2 = 255
          ElseIf Color2 < 1 Then
            Color2 = 1
          End If
          Color3 = Int(((Clr3%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
          If Color3 >= 256 Then
            Color3 = 255
          ElseIf Color3 < 1 Then
            Color3 = 1
          End If
          Col1$ = Col4$
          Col2$ = Col5$
          If ((Col1$ = "Red") Or (Col1$ = "red") Or (Col1$ = "RED") Or (Col1$ = "r") Or (Col1$ = "R")) And ((Col2$ = "Green") Or (Col2$ = "green") Or (Col2$ = "GREEN") Or (Col2$ = "g") Or (Col2$ = "G")) Then
            Red% = Color1
            Green% = Color2
            Blue% = Color3
          ElseIf ((Col1$ = "Red") Or (Col1$ = "red") Or (Col1$ = "RED") Or (Col1$ = "r") Or (Col1$ = "R")) And ((Col2$ = "Blue") Or (Col2$ = "blue") Or (Col2$ = "BLUE") Or (Col2$ = "b") Or (Col2$ = "B")) Then
            Red% = Color1
            Blue% = Color2
            Green% = Color3
          ElseIf ((Col1$ = "Green") Or (Col1$ = "green") Or (Col1$ = "GREEN") Or (Col1$ = "g") Or (Col1$ = "G")) And ((Col2$ = "Blue") Or (Col2$ = "blue") Or (Col2$ = "BLUE") Or (Col2$ = "b") Or (Col2$ = "B")) Then
            Green% = Color1
            Blue% = Color2
            Red% = Color3
          ElseIf ((Col1$ = "Green") Or (Col1$ = "green") Or (Col1$ = "GREEN") Or (Col1$ = "g") Or (Col1$ = "G")) And ((Col2$ = "Red") Or (Col2$ = "red") Or (Col2$ = "RED") Or (Col2$ = "r") Or (Col2$ = "R")) Then
            Green% = Color1
            Red% = Color2
            Blue% = Color3
          ElseIf ((Col1$ = "Blue") Or (Col1$ = "blue") Or (Col1$ = "BLUE") Or (Col1$ = "b") Or (Col1$ = "B")) And ((Col2$ = "Red") Or (Col2$ = "red") Or (Col2$ = "RED") Or (Col2$ = "r") Or (Col2$ = "R")) Then
            Blue% = Color1
            Red% = Color2
            Green% = Color3
          ElseIf ((Col1$ = "Blue") Or (Col1$ = "blue") Or (Col1$ = "BLUE") Or (Col1$ = "b") Or (Col1$ = "B")) And ((Col2$ = "Green") Or (Col2$ = "green") Or (Col2$ = "GREEN") Or (Col2$ = "g") Or (Col2$ = "G")) Then
            Blue% = Color1
            Green% = Color2
            Red% = Color3
          End If
        Red% = Int(255 * (Red% / 255) ^ Indy)
        Green% = Int(255 * (Green% / 255) ^ Indy)
        Blue% = Int(255 * (Blue% / 255) ^ Indy)
        SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
        End If
      Next
      SurvForm.Refresh
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr2%(Num%, Cnt%) = 0
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr3%(Num%, Cnt%) = 0
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr4%(Num%, Cnt%) = 0
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr5%(Num%, Cnt%) = 0
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr6%(Num%, Cnt%) = 0
      Next
    Next
    Erase Clr2%
    Erase Clr3%
    Erase Clr4%
    Erase Clr5%
    Erase Clr6%
    Close #3
    Karaleah.BiColorImageMenu.Enabled = 0
    Karaleah.TriColorImageMenu.Enabled = 0
    
    End If
  ElseIf LoadData.Caption = "append" Then
    Tempted$ = LoadData.File1.filename
    Qt$ = "N"
    Opt% = 3 Or 32
    Button% = MsgBox("Both Images Use the Same Calibration?", Opt%, "Append Image")
    'Button% = 6
    If Button% = 2 Then
      Qt$ = "Y"
    ElseIf Button% = 7 Then
      If DataForm.CalSlope.Caption = "" Then
        Qt$ = "Y"
        MsgBox "Select Initial Image Calibration", , "Append Image"
      Else
        Length% = Len(DataForm.CalSlope.Caption)
        Cal1 = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
        Load LoadData
        LoadData.Caption = "Select Appending Image Calibration"
        LoadData.Label2.Caption = "*.cal"
        LoadData.Label4.Caption = LoadData.Dir1.Path
        LoadData.File1.Pattern = "*.cal"
        LoadData.Show 1
        If LoadData.Caption = "okay" Then
          Open LoadData.File1.filename For Input As #1
          Line Input #1, Junk$
          Line Input #1, Junk$
          If Junk$ = "" Then
            Qt$ = "Y"
          Else
            Length% = Len(Junk$)
            Cal2 = Val(Mid$(Junk$, 8, Length% - 10))
            'MsgBox Str$(Cal2)
            scl = Cal1 / Cal2
          End If
          Close #1
          Unload LoadData
        Else
          Qt$ = "Y"
          Unload LoadData
        End If
      End If
    Else
      scl = 1
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Opt% = 3 Or 32 Or 256
    Button% = MsgBox("Shift Appending Image?", Opt%, "Append Image")
    If Button% = 2 Then
      Qt$ = "Y"
    ElseIf Button% = 6 Then
      DelRa$ = ""
      DelRa$ = InputBox$("Right Ascension Shift (Minutes):", "Input Right Ascension Shift", "0")
      If DelRa$ = "" Then
        Qt$ = "Y"
        MsgBox "Invalid Right Ascension Shift", 48, "Error Message"
      End If
      If Qt$ <> "Y" Then
        DelDec$ = ""
        DelDec$ = InputBox$("Declination Shift (Degrees):", "Input Degress Shift", "0")
        If DelDec$ = "" Then
          Qt$ = "Y"
          MsgBox "Invalid Declination Shift", 48, "Error Message"
        End If
      End If
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Pix1% = Pix%
    Dc$ = ""
    Dc$ = InputBox$("Pixel Resolution (Pixels):", "Input Pixel Resolution", Str$(1))
    If (Val(Dc$) - Int(Val(Dc$)) <> 0) Or (Val(Dc$) <= 0) Then
      MsgBox "Invalid Pixel Resolution", 48, "Error Message"
    Else

    Pix% = Val(Dc$)
    BoxMem$ = "N"
    DataForm.Check1.Value = 1
    Karaleah.SaveImageMenu.Enabled = 0
    Open Tempted$ For Binary As #3
    Get #3, 1, Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    SurvForm.Label4.Caption = SurvForm.Label4.Caption + " - " + Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    If Val(Junk$) < MinRaI Then
      MinRaI = Val(Junk$)
    End If
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinRaPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxRaPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinDecPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxDecPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinFluxPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxFluxPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Pix2% = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    PalNum% = Val(Junk$)
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Get #3, , Length%
        Junk$ = String$(Length%, " ")
        Get #3, , Junk$
        Pal!(Cnt%, Num%) = Val(Junk$)
      Next
    Next
    PalNum% = 8
    Pal!(1, 1) = 1
    Pal!(1, 2) = 0
    Pal!(1, 3) = 0
    Pal!(1, 4) = 0
    Pal!(2, 1) = 255 / 7
    Pal!(2, 2) = 255
    Pal!(2, 3) = 0
    Pal!(2, 4) = 255
    Pal!(3, 1) = 255 * 2 / 7
    Pal!(3, 2) = 0
    Pal!(3, 3) = 0
    Pal!(3, 4) = 255
    Pal!(4, 1) = 255 * 3 / 7
    Pal!(4, 2) = 0
    Pal!(4, 3) = 255
    Pal!(4, 4) = 255
    Pal!(5, 1) = 255 * 4 / 7
    Pal!(5, 2) = 0
    Pal!(5, 3) = 255
    Pal!(5, 4) = 0
    Pal!(6, 1) = 255 * 5 / 7
    Pal!(6, 2) = 255
    Pal!(6, 3) = 255
    Pal!(6, 4) = 0
    Pal!(7, 1) = 255 * 6 / 7
    Pal!(7, 2) = 255
    Pal!(7, 3) = 0
    Pal!(7, 4) = 0
    Pal!(8, 1) = 255
    Pal!(8, 2) = 255
    Pal!(8, 3) = 255
    Pal!(8, 4) = 255
    MinRaPI2 = Int(MinRaPI2 + 60 * Val(DelRa$))
    MaxRaPI2 = Int(MaxRaPI2 + 60 * Val(DelRa$))
    MinDecPI2 = MinDecPI2 + Val(DelDec$)
    MaxDecPI2 = MaxDecPI2 + Val(DelDec$)
    MinRaPI1 = MinRaPI
    MaxRaPI1 = MaxRaPI
    MinDecPI1 = MinDecPI
    MaxDecPI1 = MaxDecPI
    MinFluxPI1 = MinFluxPI * scl
    MaxFluxPI1 = MaxFluxPI * scl
    If (MaxRaPI1 > 43200) Or (MaxRaPI2 > 43200) Then
      If MaxRaPI1 < 43200 Then
        MinRaPI1 = MinRaPI1 + 86400
        MaxRaPI1 = MaxRaPI1 + 86400
      End If
      If MaxRaPI2 < 43200 Then
        MinRaPI2 = MinRaPI2 + 86400
        MaxRaPI2 = MaxRaPI2 + 86400
      End If
    End If
    If MinRaPI1 < MinRaPI2 Then
      MinRaPI = MinRaPI1
    Else
      MinRaPI = MinRaPI2
    End If
    If MaxRaPI1 > MaxRaPI2 Then
      MaxRaPI = MaxRaPI1
    Else
      MaxRaPI = MaxRaPI2
    End If
    If MinDecPI1 < MinDecPI2 Then
      MinDecPI = MinDecPI1
    Else
      MinDecPI = MinDecPI2
    End If
    If MaxDecPI1 > MaxDecPI2 Then
      MaxDecPI = MaxDecPI1
    Else
      MaxDecPI = MaxDecPI2
    End If
    If MinFluxPI1 < MinFluxPI2 Then
      MinFluxPI = MinFluxPI1
    Else
      MinFluxPI = MinFluxPI2
    End If
    If MaxFluxPI1 > MaxFluxPI2 Then
      MaxFluxPI = MaxFluxPI1
    Else
      MaxFluxPI = MaxFluxPI2
    End If
    SurvForm.Picture4.Line (0, 0)-(5970, 4770), QBColor(15), BF
    SurvForm.Picture5.Line (0, 0)-(1815, 1815), RGB(255, 255, 255), BF
    SurvForm.Caption = SurvForm.Label4.Caption + " - Image"
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                   "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    ReDim Clr2%(399, 319)
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Decc = (Int(4770 / 15 / Pix%) - Cnt% + 1) / Int(4770 / 15 / Pix%) * (MaxDecPI - MinDecPI) + MinDecPI
        Raa = (Int(5970 / 15 / Pix%) - Num% + 1) / Int(5970 / 15 / Pix%) * (MaxRaPI - MinRaPI) + MinRaPI
        If (Decc > MinDecPI1) And (Decc < MaxDecPI1) And (Raa > MinRaPI1) And (Raa < MaxRaPI1) Then
          Decc = Int(4770 / 15 / Pix1%) + 1 - (Decc - MinDecPI1) / (MaxDecPI1 - MinDecPI1) * Int(4770 / 15 / Pix1%)
          Raa = Int(5970 / 15 / Pix1%) + 1 - (Raa - MinRaPI1) / (MaxRaPI1 - MinRaPI1) * Int(5970 / 15 / Pix1%)
          If Clr%(Raa, Decc) <> 0 Then
            Clr2%(Num%, Cnt%) = ((Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
          End If
        End If
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr%(Num%, Cnt%) = 0
      Next
    Next
    Junk$ = String$(1, " ")
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Get #3, , Length%
        Clr%(Num%, Cnt%) = Length%
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Decc = (Int(4770 / 15 / Pix%) - Cnt% + 1) / Int(4770 / 15 / Pix%) * (MaxDecPI - MinDecPI) + MinDecPI
        Raa = (Int(5970 / 15 / Pix%) - Num% + 1) / Int(5970 / 15 / Pix%) * (MaxRaPI - MinRaPI) + MinRaPI
        If (Decc > MinDecPI2) And (Decc < MaxDecPI2) And (Raa > MinRaPI2) And (Raa < MaxRaPI2) Then
          Decc = Int(4770 / 15 / Pix2%) + 1 - (Decc - MinDecPI2) / (MaxDecPI2 - MinDecPI2) * Int(4770 / 15 / Pix2%)
          Raa = Int(5970 / 15 / Pix2%) + 1 - (Raa - MinRaPI2) / (MaxRaPI2 - MinRaPI2) * Int(5970 / 15 / Pix2%)
          If Clr%(Raa, Decc) <> 0 Then
            If (Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI2 - MinFluxPI2) + MinFluxPI2 > (Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 Then
              Clr2%(Num%, Cnt%) = ((Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI2 - MinFluxPI2) + MinFluxPI2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
            'Else
            '  Clr2%(Num%, Cnt%) = ((Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
            End If
            'Clr2%(Num%, Cnt%) = ((Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI2 - MinFluxPI2) + MinFluxPI2 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
          End If
        End If
      Next
    Next
    MinDecPI = Val(Format$(MinDecPI, "#.##"))
    MaxDecPI = Val(Format$(MaxDecPI, "#.##"))
    MinFluxPI = Val(Format$(MinFluxPI, "#.####"))
    MaxFluxPI = Val(Format$(MaxFluxPI, "#.####"))
    MinRaI = MinRaPI
    MaxRaI = MaxRaPI
    MinDecI = MinDecPI
    MaxDecI = MaxDecPI
    MinFluxI = MinFluxPI
    MaxFluxI = MaxFluxPI
    Junk$ = Str$(MinFluxPI) + " " + Str$(MaxFluxPI) + " " + Str$(MinFluxI) + " " + Str$(MaxFluxI) + " " + Str$(PalNum%) + " "
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Junk$ = Junk$ + Str$(Pal!(Cnt%, Num%)) + " "
      Next
    Next
    SurvForm.Label8.Caption = Junk$
    If DataForm.Label1.Caption = "" Then
      DataForm.Label1.Caption = "*"
    Else
      DataForm.Label1.Caption = ""
    End If
    DataForm.Picture7.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    Picture6.Line (0, 0)-(1650, 570), RGB(255, 255, 255), BF
    Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    For Cnt% = 2 To PalNum%
      For Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) To Int((Pal!(Cnt%, 1) - 1) / 254 * 414)
        Red% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
        Green% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
        Blue% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
        DataForm.Picture1.Line (Num% * 15, 0)-(Num% * 15, 465), RGB(Red%, Green%, Blue%)
        Red% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 465
        Green% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 465
        Blue% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 465
        DataForm.Picture7.Line (Num% * 15, 465 - Red%)-(Num% * 15, 465), RGB(255, 0, 0)
        DataForm.Picture8.Line (Num% * 15, 465 - Green%)-(Num% * 15, 465), RGB(0, 255, 0)
        DataForm.Picture9.Line (Num% * 15, 465 - Blue%)-(Num% * 15, 465), RGB(0, 0, 255)
      Next
      Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    Next
    Num% = Int((Pal!(8, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Clr%(Num%, Cnt%) = Clr2%(Num%, Cnt%)
        If Clr%(Num%, Cnt%) <> 0 Then
          Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
          If Color >= 256 Then
            Color = 255
          ElseIf Color < 1 Then
            Color = 1
          End If
          CntCnt% = 1
          While (Color > (Pal!(CntCnt%, 1) - 1) / 254 * 255) And (CntCnt% < PalNum%)
            CntCnt% = CntCnt% + 1
          Wend
          Red% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 2) - Pal!(CntCnt% - 1, 2)) + Pal!(CntCnt% - 1, 2)
          Green% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 3) - Pal!(CntCnt% - 1, 3)) + Pal!(CntCnt% - 1, 3)
          Blue% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 4) - Pal!(CntCnt% - 1, 4)) + Pal!(CntCnt% - 1, 4)
          SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
        End If
      Next
      SurvForm.Refresh
    Next
    Erase Clr2%
    Close #3

    End If
  ElseIf LoadData.Caption = "super" Then
    Tempted$ = LoadData.File1.filename
    Qt$ = "N"
    Opt% = 3 Or 32
    Button% = MsgBox("Both Images Use the Same Calibration?", Opt%, "Superimpose Image")
    'Button% = 6
    If Button% = 2 Then
      Qt$ = "Y"
    ElseIf Button% = 7 Then
      If DataForm.CalSlope.Caption = "" Then
        Qt$ = "Y"
        MsgBox "Select Initial Image Calibration", , "Superimpose Image"
      Else
        Length% = Len(DataForm.CalSlope.Caption)
        Cal1 = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
        Load LoadData
        LoadData.Caption = "Select Superimposing Image Calibration"
        LoadData.Label2.Caption = "*.cal"
        LoadData.Label4.Caption = LoadData.Dir1.Path
        LoadData.File1.Pattern = "*.cal"
        LoadData.Show 1
        If LoadData.Caption = "okay" Then
          Open LoadData.File1.filename For Input As #1
          Line Input #1, Junk$
          Line Input #1, Junk$
          If Junk$ = "" Then
            Qt$ = "Y"
          Else
            Length% = Len(Junk$)
            Cal2 = Val(Mid$(Junk$, 8, Length% - 10))
            scl = Cal1 / Cal2
          End If
          Close #1
          Unload LoadData
        Else
          Qt$ = "Y"
          Unload LoadData
        End If
      End If
    Else
      scl = 1
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Opt% = 3 Or 32
    Button% = MsgBox("Both Images Weighted Equally?", Opt%, "Superimpose Image")
    If Button% = 2 Then
      Qt$ = "Y"
    ElseIf Button% = 7 Then
      Dc$ = ""
      Dc$ = InputBox$("Superimposing Image Weight (%):", "Input Superimposing Image Weight", Str$(50))
      If (Val(Dc$) > 80) Or (Val(Dc$) < 20) Then
        Qt$ = "Y"
        MsgBox "Invalid Superimposing Image Weight", 48, "Error Message"
      Else
        scl = scl / (100 / (100 - Val(Dc$)) - 1)
      End If
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Opt% = 3 Or 32 Or 256
    Button% = MsgBox("Shift Superimposing Image?", Opt%, "Superimpose Image")
    If Button% = 2 Then
      Qt$ = "Y"
    ElseIf Button% = 6 Then
      DelRa$ = ""
      DelRa$ = InputBox$("Right Ascension Shift (Minutes):", "Input Right Ascension Shift", "0")
      If DelRa$ = "" Then
        Qt$ = "Y"
        MsgBox "Invalid Right Ascension Shift", 48, "Error Message"
      End If
      If Qt$ <> "Y" Then
        DelDec$ = ""
        DelDec$ = InputBox$("Declination Shift (Degrees):", "Input Degress Shift", "0")
        If DelDec$ = "" Then
          Qt$ = "Y"
          MsgBox "Invalid Declination Shift", 48, "Error Message"
        End If
      End If
    End If
    If Qt$ = "Y" Then
      GoTo Qtt
    End If
    Pix1% = Pix%
    Dc$ = ""
    Dc$ = InputBox$("Pixel Resolution (Pixels):", "Input Pixel Resolution", Str$(1))
    If (Val(Dc$) - Int(Val(Dc$)) <> 0) Or (Val(Dc$) <= 0) Then
      MsgBox "Invalid Pixel Resolution", 48, "Error Message"
    Else

    Pix% = Val(Dc$)
    BoxMem$ = "N"
    DataForm.Check1.Value = 1
    Karaleah.SaveImageMenu.Enabled = 0
    Open Tempted$ For Binary As #3
    Get #3, 1, Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    SurvForm.Label4.Caption = SurvForm.Label4.Caption + " - " + Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    If Val(Junk$) < MinRaI Then
      MinRaI = Val(Junk$)
    End If
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinRaPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxRaPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinDecPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxDecPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MinFluxPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    MaxFluxPI2 = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    Pix2% = Val(Junk$)
    Get #3, , Length%
    Junk$ = String$(Length%, " ")
    Get #3, , Junk$
    PalNum% = Val(Junk$)
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Get #3, , Length%
        Junk$ = String$(Length%, " ")
        Get #3, , Junk$
        Pal!(Cnt%, Num%) = Val(Junk$)
      Next
    Next
    PalNum% = 8
    Pal!(1, 1) = 1
    Pal!(1, 2) = 0
    Pal!(1, 3) = 0
    Pal!(1, 4) = 0
    Pal!(2, 1) = 255 / 7
    Pal!(2, 2) = 255
    Pal!(2, 3) = 0
    Pal!(2, 4) = 255
    Pal!(3, 1) = 255 * 2 / 7
    Pal!(3, 2) = 0
    Pal!(3, 3) = 0
    Pal!(3, 4) = 255
    Pal!(4, 1) = 255 * 3 / 7
    Pal!(4, 2) = 0
    Pal!(4, 3) = 255
    Pal!(4, 4) = 255
    Pal!(5, 1) = 255 * 4 / 7
    Pal!(5, 2) = 0
    Pal!(5, 3) = 255
    Pal!(5, 4) = 0
    Pal!(6, 1) = 255 * 5 / 7
    Pal!(6, 2) = 255
    Pal!(6, 3) = 255
    Pal!(6, 4) = 0
    Pal!(7, 1) = 255 * 6 / 7
    Pal!(7, 2) = 255
    Pal!(7, 3) = 0
    Pal!(7, 4) = 0
    Pal!(8, 1) = 255
    Pal!(8, 2) = 255
    Pal!(8, 3) = 255
    Pal!(8, 4) = 255
    MinRaPI2 = Int(MinRaPI2 + 60 * Val(DelRa$))
    MaxRaPI2 = Int(MaxRaPI2 + 60 * Val(DelRa$))
    MinDecPI2 = MinDecPI2 + Val(DelDec$)
    MaxDecPI2 = MaxDecPI2 + Val(DelDec$)
    MinRaPI1 = MinRaPI
    MaxRaPI1 = MaxRaPI
    MinDecPI1 = MinDecPI
    MaxDecPI1 = MaxDecPI
    MinFluxPI1 = MinFluxPI * scl
    MaxFluxPI1 = MaxFluxPI * scl
    If (MaxRaPI1 > 43200) Or (MaxRaPI2 > 43200) Then
      If MaxRaPI1 < 43200 Then
        MinRaPI1 = MinRaPI1 + 86400
        MaxRaPI1 = MaxRaPI1 + 86400
      End If
      If MaxRaPI2 < 43200 Then
        MinRaPI2 = MinRaPI2 + 86400
        MaxRaPI2 = MaxRaPI2 + 86400
      End If
    End If
    If MinRaPI1 < MinRaPI2 Then
      MinRaPI = MinRaPI1
    Else
      MinRaPI = MinRaPI2
    End If
    If MaxRaPI1 > MaxRaPI2 Then
      MaxRaPI = MaxRaPI1
    Else
      MaxRaPI = MaxRaPI2
    End If
    If MinDecPI1 < MinDecPI2 Then
      MinDecPI = MinDecPI1
    Else
      MinDecPI = MinDecPI2
    End If
    If MaxDecPI1 > MaxDecPI2 Then
      MaxDecPI = MaxDecPI1
    Else
      MaxDecPI = MaxDecPI2
    End If
    SurvForm.Picture4.Line (0, 0)-(5970, 4770), QBColor(15), BF
    SurvForm.Picture5.Line (0, 0)-(1815, 1815), RGB(255, 255, 255), BF
    SurvForm.Caption = SurvForm.Label4.Caption + " - Image"
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                                   "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    ReDim Clr2%(399, 319)
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Decc = (Int(4770 / 15 / Pix%) - Cnt% + 1) / Int(4770 / 15 / Pix%) * (MaxDecPI - MinDecPI) + MinDecPI
        Raa = (Int(5970 / 15 / Pix%) - Num% + 1) / Int(5970 / 15 / Pix%) * (MaxRaPI - MinRaPI) + MinRaPI
        If (Decc > MinDecPI1) And (Decc < MaxDecPI1) And (Raa > MinRaPI1) And (Raa < MaxRaPI1) Then
          Decc = Int(4770 / 15 / Pix1%) + 1 - (Decc - MinDecPI1) / (MaxDecPI1 - MinDecPI1) * Int(4770 / 15 / Pix1%)
          Raa = Int(5970 / 15 / Pix1%) + 1 - (Raa - MinRaPI1) / (MaxRaPI1 - MinRaPI1) * Int(5970 / 15 / Pix1%)
          If Clr%(Raa, Decc) <> 0 Then
            Clr2%(Num%, Cnt%) = Clr%(Raa, Decc)
          End If
        End If
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Clr%(Num%, Cnt%) = 0
      Next
    Next
    Junk$ = String$(1, " ")
    For Cnt% = 1 To Int(4770 / 15 / Pix2%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix2%) + 1
        Get #3, , Length%
        Clr%(Num%, Cnt%) = Length%
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Decc = (Int(4770 / 15 / Pix%) - Cnt% + 1) / Int(4770 / 15 / Pix%) * (MaxDecPI - MinDecPI) + MinDecPI
        Raa = (Int(5970 / 15 / Pix%) - Num% + 1) / Int(5970 / 15 / Pix%) * (MaxRaPI - MinRaPI) + MinRaPI
        If (Decc > MinDecPI2) And (Decc < MaxDecPI2) And (Raa > MinRaPI2) And (Raa < MaxRaPI2) Then
          Decc = Int(4770 / 15 / Pix2%) + 1 - (Decc - MinDecPI2) / (MaxDecPI2 - MinDecPI2) * Int(4770 / 15 / Pix2%)
          Raa = Int(5970 / 15 / Pix2%) + 1 - (Raa - MinRaPI2) / (MaxRaPI2 - MinRaPI2) * Int(5970 / 15 / Pix2%)
          If Clr%(Raa, Decc) <> 0 Then
            If Clr2%(Num%, Cnt%) <> 0 Then
              Clr2%(Num%, Cnt%) = (((Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 + (Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI2 - MinFluxPI2) + MinFluxPI2) / 2 - MinFluxPI1) / (MaxFluxPI1 - MinFluxPI1) * 4999 + 1
            Else
              Clr2%(Num%, Cnt%) = ((Clr%(Raa, Decc) - 1) / 4999 * (MaxFluxPI2 - MinFluxPI2) + MinFluxPI2 - MinFluxPI1) / (MaxFluxPI1 - MinFluxPI1) * 4999 + 1
            End If
          End If
        End If
      Next
    Next
    MinFluxPI = 1000
    MaxFluxPI = -1000
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        If Clr2%(Num%, Cnt%) <> 0 Then
          If (Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 < MinFluxPI Then
            MinFluxPI = (Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1
          End If
          If (Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 > MaxFluxPI Then
            MaxFluxPI = (Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1
          End If
        End If
      Next
    Next
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        If Clr2%(Num%, Cnt%) <> 0 Then
          Clr2%(Num%, Cnt%) = ((Clr2%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI1 - MinFluxPI1) + MinFluxPI1 - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 4999 + 1
        End If
      Next
    Next
    MinDecPI = Val(Format$(MinDecPI, "#.##"))
    MaxDecPI = Val(Format$(MaxDecPI, "#.##"))
    MinFluxPI = Val(Format$(MinFluxPI, "#.####"))
    MaxFluxPI = Val(Format$(MaxFluxPI, "#.####"))
    MinRaI = MinRaPI
    MaxRaI = MaxRaPI
    MinDecI = MinDecPI
    MaxDecI = MaxDecPI
    MinFluxI = MinFluxPI
    MaxFluxI = MaxFluxPI
    Junk$ = Str$(MinFluxPI) + " " + Str$(MaxFluxPI) + " " + Str$(MinFluxI) + " " + Str$(MaxFluxI) + " " + Str$(PalNum%) + " "
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Junk$ = Junk$ + Str$(Pal!(Cnt%, Num%)) + " "
      Next
    Next
    SurvForm.Label8.Caption = Junk$
    If DataForm.Label1.Caption = "" Then
      DataForm.Label1.Caption = "*"
    Else
      DataForm.Label1.Caption = ""
    End If
    DataForm.Picture7.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (0, 0)-(6210, 465), RGB(255, 255, 255), BF
    Picture6.Line (0, 0)-(1650, 570), RGB(255, 255, 255), BF
    Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    For Cnt% = 2 To PalNum%
      For Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) To Int((Pal!(Cnt%, 1) - 1) / 254 * 414)
        Red% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
        Green% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
        Blue% = (Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
        DataForm.Picture1.Line (Num% * 15, 0)-(Num% * 15, 465), RGB(Red%, Green%, Blue%)
        Red% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 465
        Green% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 465
        Blue% = ((Num% - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 414) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 465
        DataForm.Picture7.Line (Num% * 15, 465 - Red%)-(Num% * 15, 465), RGB(255, 0, 0)
        DataForm.Picture8.Line (Num% * 15, 465 - Green%)-(Num% * 15, 465), RGB(0, 255, 0)
        DataForm.Picture9.Line (Num% * 15, 465 - Blue%)-(Num% * 15, 465), RGB(0, 0, 255)
      Next
      Num% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    Next
    Num% = Int((Pal!(8, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    For Cnt% = 1 To Int(4770 / 15 / Pix%) + 1
      For Num% = 1 To Int(5970 / 15 / Pix%) + 1
        Clr%(Num%, Cnt%) = Clr2%(Num%, Cnt%)
        If Clr%(Num%, Cnt%) <> 0 Then
          Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
          If Color >= 256 Then
            Color = 255
          ElseIf Color < 1 Then
            Color = 1
          End If
          CntCnt% = 1
          While (Color > (Pal!(CntCnt%, 1) - 1) / 254 * 255) And (CntCnt% < PalNum%)
            CntCnt% = CntCnt% + 1
          Wend
          Red% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 2) - Pal!(CntCnt% - 1, 2)) + Pal!(CntCnt% - 1, 2)
          Green% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 3) - Pal!(CntCnt% - 1, 3)) + Pal!(CntCnt% - 1, 3)
          Blue% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 4) - Pal!(CntCnt% - 1, 4)) + Pal!(CntCnt% - 1, 4)
          SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
        End If
      Next
      SurvForm.Refresh
    Next
    Erase Clr2%
    Close #3

    End If
Qtt:
  End If
  If LoadData.Caption <> "show" Then
    Unload LoadData
  End If
End Sub

Private Sub Picture4_KeyPress(KeyAscii As Integer)
  Char = Chr(KeyAscii)
  If Char = "a" And Box$ <> "Y" Then
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    factor = 1
    If DataForm.CalSlope.Caption <> "" Then
      Length% = Len(DataForm.CalSlope.Caption)
      factor = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    End If
    Y = 0
    Counter% = 0
    For Num% = 1 To XMax%
      For Cnt% = 1 To YMax%
        If Clr%(Num%, Cnt%) > 0 Then
          Y = Y + factor * (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
          Counter% = Counter% + 1
        End If
      Next
    Next
    MsgBox Y / Counter%
  End If
  
  If Char = "s" And Box$ <> "Y" Then
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    factor = 1
    If DataForm.CalSlope.Caption <> "" Then
      Length% = Len(DataForm.CalSlope.Caption)
      factor = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    End If
    Y = 0
    Counter% = 0
    For Num% = 1 To XMax%
      For Cnt% = 1 To YMax%
        If Clr%(Num%, Cnt%) > 0 Then
          Y = Y + factor * (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
          Counter% = Counter% + 1
        End If
      Next
    Next
    MsgBox Y
  End If
  
  If Char = "d" And Box$ = "Y" Then
    XTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxRaI - MinRaI) * 240 * 5970
    YTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxDecI - MinDecI) * 4770
    Num1% = Int((XOld - XTmp) / 15 / Pix% + 1)
    Num2% = Int((XOld + XTmp) / 15 / Pix% + 1)
    Cnt1% = Int((YOld - YTmp) / 15 / Pix% + 1)
    Cnt2% = Int((YOld + YTmp) / 15 / Pix% + 1)
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    factor = 1
    If DataForm.CalSlope.Caption <> "" Then
      Length% = Len(DataForm.CalSlope.Caption)
      factor = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    End If
    Y = 0
    Counter% = 0
    For Num% = 1 To Num1%
      For Cnt% = 1 To YMax%
        If Clr%(Num%, Cnt%) > 0 Then
          Y = Y + factor * (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
          Counter% = Counter% + 1
        End If
      Next
    Next
    For Num% = Num2% To XMax%
      For Cnt% = 1 To YMax%
        If Clr%(Num%, Cnt%) > 0 Then
          Y = Y + factor * (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
          Counter% = Counter% + 1
        End If
      Next
    Next
  MsgBox Y
  End If

  If Char = "s" And Box$ = "Y" Then
    XTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxRaI - MinRaI) * 240 * 5970
    YTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxDecI - MinDecI) * 4770
    Num1% = Int((XOld - XTmp) / 15 / Pix% + 1)
    Num2% = Int((XOld + XTmp) / 15 / Pix% + 1)
    Cnt1% = Int((YOld - YTmp) / 15 / Pix% + 1)
    Cnt2% = Int((YOld + YTmp) / 15 / Pix% + 1)
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    factor = 1
    If DataForm.CalSlope.Caption <> "" Then
      Length% = Len(DataForm.CalSlope.Caption)
      factor = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    End If
    Y = 0
    Counter% = 0
    For Num% = Num1% To Num2%
      For Cnt% = Cnt1% To Cnt2%
        If Clr%(Num%, Cnt%) > 0 Then
          Y = Y + factor * (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
          Counter% = Counter% + 1
        End If
      Next
    Next
  MsgBox Y
  End If

  If Char = "a" And Box$ = "Y" Then
    XTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxRaI - MinRaI) * 240 * 5970
    YTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxDecI - MinDecI) * 4770
    Num1% = Int((XOld - XTmp) / 15 / Pix% + 1)
    Num2% = Int((XOld + XTmp) / 15 / Pix% + 1)
    Cnt1% = Int((YOld - YTmp) / 15 / Pix% + 1)
    Cnt2% = Int((YOld + YTmp) / 15 / Pix% + 1)
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    factor = 1
    If DataForm.CalSlope.Caption <> "" Then
      Length% = Len(DataForm.CalSlope.Caption)
      factor = Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    End If
    Y = 0
    Counter% = 0
    For Num% = Num1% To Num2%
      For Cnt% = Cnt1% To Cnt2%
        If Clr%(Num%, Cnt%) > 0 Then
          Y = Y + factor * (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
          Counter% = Counter% + 1
        End If
      Next
    Next
  MsgBox Y / Counter%
  End If

'  If Box$ = "Y" Then
'    XTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxRaI - MinRaI) * 240 * 5970
'    YTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxDecI - MinDecI) * 4770
'    Num1% = Int((XOld - XTmp) / 15 / Pix% + 1)
'    Num2% = Int((XOld + XTmp) / 15 / Pix% + 1)
'    Cnt1% = Int((YOld - YTmp) / 15 / Pix% + 1)
'    Cnt2% = Int((YOld + YTmp) / 15 / Pix% + 1)
'    XMax% = Int(5970 / 15 / Pix%) + 1
'    YMax% = Int(4770 / 15 / Pix%) + 1
'    For Num% = Num1% To Num2%
'      For Cnt% = Cnt1% To Cnt1% + 1
'        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% >= 1) Then
'          If Clr%(Num%, Cnt%) <> 0 Then
'            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
'            GoSub Clr:
'            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
'          Else
'            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
'          End If
'        End If
'      Next
'      For Cnt% = Cnt2% To Cnt2% + 1
'        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% <= YMax%) Then
'          If Clr%(Num%, Cnt%) <> 0 Then
'            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
'            GoSub Clr:
'            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
'          Else
'            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
'          End If
'        End If
'      Next
'    Next

End Sub

Private Sub Picture4_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If (Box$ <> "Y") And (Button = 2) Then
    Box$ = "Y"
    Karaleah.Label1.Caption = "Y"
    XOld = X
    YOld = Y
  ElseIf (Box$ = "Y") And (Button = 2) Then
    Box$ = "N"
    Karaleah.Label1.Caption = "N"
    XTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxRaI - MinRaI) * 240 * 5970
    YTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxDecI - MinDecI) * 4770
    Num1% = Int((XOld - XTmp) / 15 / Pix% + 1)
    Num2% = Int((XOld + XTmp) / 15 / Pix% + 1)
    Cnt1% = Int((YOld - YTmp) / 15 / Pix% + 1)
    Cnt2% = Int((YOld + YTmp) / 15 / Pix% + 1)
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    For Num% = Num1% To Num2%
      For Cnt% = Cnt1% To Cnt1% + 1
        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% >= 1) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clrr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
      For Cnt% = Cnt2% To Cnt2% + 1
        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clrr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
    Next
    For Cnt% = Cnt1% To Cnt2%
      For Num% = Num1% To Num1% + 1
        If (Num% >= 1) And (Cnt% >= 1) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clrr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
      For Num% = Num2% To Num2% + 1
        If (Num% <= XMax%) And (Cnt% >= 1) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clrr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
    Next
    SurvForm.Refresh
  ElseIf (Box$ = "Y") And (Button = 1) Then
    BoxMem$ = "Y"
    XTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxRaI - MinRaI) * 240 * 5970
    YTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxDecI - MinDecI) * 4770
    PixX% = Pix% / 2 / XTmp * 1815
    PixY% = Pix% / 2 / YTmp * 1815
    XMem1 = XOld - XTmp
    XMem2 = 2 * XTmp
    YMem1 = YOld - YTmp
    YMem2 = 2 * YTmp
    Num1% = Int((XOld - XTmp) / 15 / Pix% + 1)
    Num2% = Int((XOld + XTmp) / 15 / Pix% + 1)
    Cnt1% = Int((YOld - YTmp) / 15 / Pix% + 1)
    Cnt2% = Int((YOld + YTmp) / 15 / Pix% + 1)
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    MinRaB = (5970 - XOld - XTmp) / 5970 * (MaxRaI - MinRaI) + MinRaI
    MaxRaB = (5970 - XOld + XTmp) / 5970 * (MaxRaI - MinRaI) + MinRaI
    MinDecB = (4770 - YOld - YTmp) / 4770 * (MaxDecI - MinDecI) + MinDecI
    MaxDecB = (4770 - YOld + YTmp) / 4770 * (MaxDecI - MinDecI) + MinDecI
    MinFluxB = 1000000
    MaxFluxB = -1000000
    For Cnt% = Cnt1% To Cnt2%
      For Num% = Num1% To Num2%
        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% >= 1) And (Cnt% < YMax%) Then
          If (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI < MinFluxB Then
            MinFluxB = (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
          End If
          If (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI > MaxFluxB Then
            MaxFluxB = (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
          End If
        End If
      Next
    Next
    For Cnt% = Cnt1% To Cnt2%
      For Num% = Num1% To Num2%
        XTemp% = ((Num% - 1) * 15 * Pix% - XOld + XTmp) / 2 / XTmp * 1815
        YTemp% = ((Cnt% - 1) * 15 * Pix% - YOld + YTmp) / 2 / YTmp * 1815
        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% >= 1) And (Cnt% < YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxB) / (MaxFluxB - MinFluxB) * 255) + 1
            GoSub Clrr:
            SurvForm.Picture5.Line (XTemp%, YTemp%)-(XTemp% + 15 * PixX%, YTemp% + 15 * PixY%), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture5.Line (XTemp%, YTemp%)-(XTemp% + 15 * PixX%, YTemp% + 15 * PixY%), RGB(255, 255, 255), BF
          End If
        Else
          SurvForm.Picture5.Line (XTemp%, YTemp%)-(XTemp% + 15 * PixX%, YTemp% + 15 * PixY%), RGB(255, 255, 255), BF
        End If
      Next
      SurvForm.Refresh
    Next
  End If
Exit Sub

Clrr:
  If Color >= 256 Then
    Color = 255
  ElseIf Color < 1 Then
    Color = 1
  End If
  CntCnt% = 1
  While (Color > (Pal!(CntCnt%, 1) - 1) / 254 * 255) And (CntCnt% < PalNum%)
    CntCnt% = CntCnt% + 1
  Wend
  Red% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 2) - Pal!(CntCnt% - 1, 2)) + Pal!(CntCnt% - 1, 2)
  Green% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 3) - Pal!(CntCnt% - 1, 3)) + Pal!(CntCnt% - 1, 3)
  Blue% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 4) - Pal!(CntCnt% - 1, 4)) + Pal!(CntCnt% - 1, 4)
  Return
End Sub

Private Sub Picture4_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If Box$ = "Y" Then
    XTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxRaI - MinRaI) * 240 * 5970
    YTmp = Val(SurvForm.Label6.Caption) / 2 / (MaxDecI - MinDecI) * 4770
    Num1% = Int((XOld - XTmp) / 15 / Pix% + 1)
    Num2% = Int((XOld + XTmp) / 15 / Pix% + 1)
    Cnt1% = Int((YOld - YTmp) / 15 / Pix% + 1)
    Cnt2% = Int((YOld + YTmp) / 15 / Pix% + 1)
    XMax% = Int(5970 / 15 / Pix%) + 1
    YMax% = Int(4770 / 15 / Pix%) + 1
    For Num% = Num1% To Num2%
      For Cnt% = Cnt1% To Cnt1% + 1
        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% >= 1) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
      For Cnt% = Cnt2% To Cnt2% + 1
        If (Num% >= 1) And (Num% <= XMax%) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
    Next
    For Cnt% = Cnt1% To Cnt2%
      For Num% = Num1% To Num1% + 1
        If (Num% >= 1) And (Cnt% >= 1) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
      For Num% = Num2% To Num2% + 1
        If (Num% <= XMax%) And (Cnt% >= 1) And (Cnt% <= YMax%) Then
          If Clr%(Num%, Cnt%) <> 0 Then
            Color = Int(((Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI - MinFluxI) / (MaxFluxI - MinFluxI) * 255) + 1
            GoSub Clr:
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(Red%, Green%, Blue%), BF
          Else
            SurvForm.Picture4.Line ((Num% - 1) * 15 * Pix%, (Cnt% - 1) * 15 * Pix%)-(Num% * 15 * Pix% - 15, Cnt% * 15 * Pix% - 15), RGB(255, 255, 255), BF
          End If
        End If
      Next
    Next
    Color = 255
    GoSub Clr:
    SurvForm.Picture4.Line (X - XTmp, Y - YTmp)-(X - XTmp, Y + YTmp), RGB(Red%, Green%, Blue%)
    SurvForm.Picture4.Line (X + XTmp, Y - YTmp)-(X + XTmp, Y + YTmp), RGB(Red%, Green%, Blue%)
    SurvForm.Picture4.Line (X - XTmp, Y - YTmp)-(X + XTmp, Y - YTmp), RGB(Red%, Green%, Blue%)
    SurvForm.Picture4.Line (X - XTmp, Y + YTmp)-(X + XTmp, Y + YTmp), RGB(Red%, Green%, Blue%)
    XOld = X
    YOld = Y
    SurvForm.Refresh
  End If
  X = (5970 - X) / 5970 * (MaxRaI - MinRaI) + MinRaI
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                                   "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  Y = (4770 - Y) / 4770 * (MaxDecI - MinDecI) + MinDecI
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
  XMax% = Int(5970 / 15 / Pix%) + 1
  YMax% = Int(4770 / 15 / Pix%) + 1
  X = 5970 - (X - MinRaI) / (MaxRaI - MinRaI) * 5970
  Num% = 1
  While ((Num% - 1) * 15 * Pix% < X) And (Num% < XMax%)
    Num% = Num% + 1
  Wend
  Y = 4770 - (Y - MinDecI) / (MaxDecI - MinDecI) * 4770
  Cnt% = 1
  While ((Cnt% - 1) * 15 * Pix% < Y) And (Cnt% < YMax%)
    Cnt% = Cnt% + 1
  Wend
  If Clr%(Num%, Cnt%) <> 0 Then
    Y = (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
    If DataForm.CalSlope.Caption <> "" Then
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
    If DataForm.CalSlope.Caption <> "" Then
      Print " Jy"
    End If
  End If
  SurvForm.Refresh
Exit Sub

Clr:
  If Color >= 256 Then
    Color = 255
  ElseIf Color < 1 Then
    Color = 1
  End If
  CntCnt% = 1
  While (Color > (Pal!(CntCnt%, 1) - 1) / 254 * 255) And (CntCnt% < PalNum%)
    CntCnt% = CntCnt% + 1
  Wend
  Red% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 2) - Pal!(CntCnt% - 1, 2)) + Pal!(CntCnt% - 1, 2)
  Green% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 3) - Pal!(CntCnt% - 1, 3)) + Pal!(CntCnt% - 1, 3)
  Blue% = (Color - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) / (Int((Pal!(CntCnt%, 1) - 1) / 254 * 255) - Int((Pal!(CntCnt% - 1, 1) - 1) / 254 * 255)) * (Pal!(CntCnt%, 4) - Pal!(CntCnt% - 1, 4)) + Pal!(CntCnt% - 1, 4)
  Return
End Sub

Private Sub Picture5_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If BoxMem$ = "Y" Then

  X = (1815 - X) / 1815 * (MaxRaB - MinRaB) + MinRaB
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                                   "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  Y = (1815 - Y) / 1815 * (MaxDecB - MinDecB) + MinDecB
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
  XMax% = Int(5970 / 15 / Pix%) + 1
  YMax% = Int(4770 / 15 / Pix%) + 1
  X = 1815 - (X - MinRaB) / (MaxRaB - MinRaB) * 1815
  Num% = 1
  While (((Num% - 1) * 15 * Pix% - XMem1) / XMem2 * 1815 <= X) And (Num% <= XMax% + 1)
    Num% = Num% + 1
  Wend
  Num% = Num% - 1
  Y = 1815 - (Y - MinDecB) / (MaxDecB - MinDecB) * 1815
  Cnt% = 1
  While (((Cnt% - 1) * 15 * Pix% - YMem1) / YMem2 * 1815 <= Y) And (Cnt% <= YMax% + 1)
    Cnt% = Cnt% + 1
  Wend
  Cnt% = Cnt% - 1
  If (Clr%(Num%, Cnt%) <> 0) And (Num% >= 1) And (Num% <= XMax%) And (Cnt% >= 1) And (Cnt% < YMax%) Then
    Y = (Clr%(Num%, Cnt%) - 1) / 4999 * (MaxFluxPI - MinFluxPI) + MinFluxPI
    If DataForm.CalSlope.Caption <> "" Then
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
    If DataForm.CalSlope.Caption <> "" Then
      Print " Jy"
    End If
  End If
  SurvForm.Refresh

  End If
End Sub

Private Sub Picture6_GotFocus()
  If LoadData.Caption = "save" Or LoadData.Caption = "saveplus" Then
    Open LoadData.Text1.Text For Output As #3
    Print #3, SurvForm.Label1.Caption
    Print #3, SurvForm.Label2.Caption
    Print #3, SwpCnt%
    Print #3, Swp%
    Print #3, Format$(Calib!(0), "#.####")
    Print #3, Format$(Calib!(Swp%), "#.####")
    For Num% = 1 To 240
      Print #3, Ra!(0, Num%)
      Print #3, Format$(Dec!(0, Num%), "#.##")
      Print #3, Format$(Flux!(0, Num%), "#.####")
    Next
    For Cnt% = 1 To Swp%
      Print #3, Format$(MinDec(Cnt%), "#.##")
      Print #3, Format$(MaxDec(Cnt%), "#.##")
      Print #3, Format$(MinFlux(Cnt%), "#.####")
      Print #3, Format$(MaxFlux(Cnt%), "#.####")
      Print #3, Format$(Calib!(Cnt%), "#.####")
      Print #3, Total%(Cnt%)
      For Num% = 1 To Total%(Cnt%)
        Print #3, Ra!(Cnt%, Num%)
        Print #3, Format$(Dec!(Cnt%, Num%), "#.##")
        Print #3, Format$(Flux!(Cnt%, Num%), "#.####")
      Next
    Next
    Close #3
    If LoadData.Caption = "save" Then
      SurvForm.Label3.Caption = LoadData.Label4.Caption + "\" + LoadData.Text1.Text
    End If
    Karaleah.SaveSurveyMenu.Enabled = -1
  ElseIf LoadData.Caption = "sweep" Then
    If Mv$ <> "Y" Then
      SwpCntMv% = SwpCnt%
      CalledMv$ = Called$
    End If
    Junk$ = InputBox$("Sweep Number (1 - " + Str$(SwpCntMv% - 1) + ") :", "Input Sweep Number", Str$(SwpCntMv% - 1))
    If Val(Junk$) < 1 Or Val(Junk$) >= SwpCntMv% Or Val(Junk$) <> Int(Val(Junk$)) Then
      MsgBox "Invalid Sweep Number", 48, "Error Message"
    Else
      Mv$ = "Y"
      Karaleah.SaveSurveyMenu.Enabled = 0
      Karaleah.SaveAsSurveyMenu.Enabled = 0
      SwpCnt% = Val(Junk$)
      Called$ = "Y"
      Can$ = "N"
      Cal$ = "Y"
      SurvForm.FontTransparent = 0
      CurrentY = 2770
      CurrentX = 180
      Print "  "
      CurrentX = 180
      Print "  "
      CurrentX = 180
      Print "  "
      CurrentX = 210
      Print "  "
      CurrentX = 210
      Print "  "
      CurrentX = 180
      Print "  "
      CurrentX = 180
      Print "  "
      CurrentX = 210
      Print "  "
      CurrentX = 210
      Print "  "
      CurrentX = 180
      Print "  "
      CurrentX = 180
      Print "  "
      CurrentY = 2430
      CurrentX = 2760
      Print "                        "
      CurrentY = 3000
      CurrentX = 6720
      Print "                  "
      CurrentY = 3285
      CurrentX = 6960
      Print "                        "
      CurrentY = 3525
      CurrentX = 6960
      Print "                        "
      CurrentY = 4680
      CurrentX = 6720
      Print "                       "
      CurrentX = 6720
      Print "                       "
      CurrentX = 6720
      Print "                       "
      SurvForm.FontTransparent = -1
      SurvForm.Caption = SurvForm.Label2.Caption + " - Sweep" + Str$(SwpCnt%)
      CurrentY = 3450
      CurrentX = 180
      Print "F"
      CurrentX = 210
      Print "l"
      CurrentX = 180
      Print "u"
      CurrentX = 180
      Print "x"
      CurrentY = 2430
      CurrentX = 3000
      Print "Declination"
      SurvForm.Command8.Visible = 0
      SurvForm.Command9.Visible = 0
      SurvForm.Command10.Visible = 0
      SurvForm.Command11.Visible = 0
      SurvForm.Command1.Enabled = -1
      SurvForm.Command1.Visible = -1
      SurvForm.Command1.SetFocus
      SurvForm.Command2.Visible = -1
      SurvForm.Command3.Visible = -1
      SurvForm.Command4.Visible = -1
      SurvForm.Check1.Visible = 0
      SurvForm.Check2.Visible = 0
      SurvForm.Check1.Value = 1
      SurvForm.Check2.Value = 1
      SurvForm.Picture6.Visible = 0
      SurvForm.Picture7.Visible = 0
      SurvForm.Picture8.Visible = 0
      SurvForm.Picture9.Visible = 0
      SurvForm.Picture2.Line (0, 0)-(5970, 2130), QBColor(15), BF
      SurvForm.Picture3.Line (0, 0)-(5970, 2130), QBColor(15), BF
      SurvForm.Picture2.Visible = -1
      SurvForm.Picture3.Visible = -1
      SurvForm.Refresh
      SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
      SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
      SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
      SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
      CutSeg$ = "N"
      SelSeg$ = "N"
      Down1$ = "N"
      Down2$ = "N"
      Down3$ = "N"
      Down4$ = "N"
      For Num% = 1 To Total%(SwpCnt%)
        X = (Dec!(SwpCnt%, Num%) - MinDec(SwpCnt%)) / (MaxDec(SwpCnt%) - MinDec(SwpCnt%)) * 5970
        Y = 2130 - (Flux!(SwpCnt%, Num%) - MinFlux(SwpCnt%)) / (MaxFlux(SwpCnt%) - MinFlux(SwpCnt%)) * 2130
        SurvForm.Picture2.Circle (X, Y), 15, QBColor(12)
      Next
      SurvForm.Refresh
    End If
  End If
  If LoadData.Caption <> "show" Then
    Unload LoadData
  End If
End Sub

Private Sub Picture6_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down1$ = "N" And Button = 1 Then
    Down1$ = "Y"
    XBeg% = X
    Down2$ = "N"
    SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture7.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If Y >= 0 And Y <= 2130 Then
        If Check%(Num%) = -1 Then
          SurvForm.Picture7.PSet (X, Y), QBColor(7)
        Else
          SurvForm.Picture7.Circle (X, Y), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  ElseIf CutSeg$ = "Y" And Down1$ = "Y" And Button = 2 Then
    Down1$ = "N"
    SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture6.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If Y >= 0 And Y <= 2130 Then
        If Check%(Num%) = -1 Then
          SurvForm.Picture6.PSet (X, Y), QBColor(7)
        Else
          SurvForm.Picture6.Circle (X, Y), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  ElseIf CutSeg$ = "Y" And Down1$ = "Y" And Button = 1 Then
    Down1$ = "N"
    MinMem = MinFlux1
    MaxMem = MaxFlux1
    MinFlux1 = 100
    MaxFlux1 = -100
    For Num% = 1 To 120
      XTemp% = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      If Abs(XTemp% - XBeg%) <= Abs(X - XBeg%) And Abs(XTemp% - X) <= Abs(X - XBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux!(0, Num%) < MinFlux1 Then
          MinFlux1 = Flux!(0, Num%)
        End If
        If Flux!(0, Num%) > MaxFlux1 Then
          MaxFlux1 = Flux!(0, Num%)
        End If
      End If
    Next
    If MinFlux1 = 100 Or MaxFlux1 = -100 Or MinFlux1 = MaxFlux1 Then
      MinFlux1 = MinMem
      MaxFlux1 = MaxMem
    End If
    SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture6.Line (X, 0)-(X, 2145), QBColor(8)
    SurvForm.Picture8.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If Check%(Num%) = -1 Then
        If Y >= 0 And Y <= 2130 Then
          SurvForm.Picture6.PSet (X, Y), QBColor(7)
        End If
        Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
        SurvForm.Picture8.PSet (X, Y), QBColor(7)
      Else
        If Y >= 0 And Y <= 2130 Then
          SurvForm.Picture6.Circle (X, Y), 15, QBColor(12)
        End If
        Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
        SurvForm.Picture8.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh

    CalA = 0
    CalB = 0
    Tot1% = 0
    Tot2% = 0
    For Num% = 1 To 60
      If Check%(Num%) <> -1 Then
        CalA = CalA + Flux!(0, Num%)
        Tot1% = Tot1% + 1
      End If
    Next
    For Num% = 61 To 120
      If Check%(Num%) <> -1 Then
        CalB = CalB + Flux!(0, Num%)
        Tot2% = Tot2% + 1
      End If
    Next
    SurvForm.FontTransparent = 0
    CurrentY = 3285
    CurrentX = 6960
    Print "                        "
    SurvForm.FontTransparent = -1
    CurrentY = 3285
    CurrentX = 6960
    If Tot1% > 0 And Tot2% > 0 Then
      CalA = CalA / Tot1%
      CalB = CalB / Tot2%
      Cal1 = CalA - CalB
      Print "Initial: "; Format$(Cal1, "#.###"); " V"
    Else
      Print "Initial"
      SurvForm.Check1.Value = 0
      SurvForm.Check1.Enabled = 0
      If SurvForm.Check1.Value = 0 And SurvForm.Check2.Value = 0 Then
        SurvForm.Command8.Enabled = 0
        CurrentY = 3960
        CurrentX = 6720
        Print "Input Calibration:"
        SurvForm.Text1.Text = ""
        SurvForm.Text1.Visible = -1
        SurvForm.Text1.SetFocus
      End If
    End If
    SurvForm.Refresh
  End If
End Sub

Private Sub Picture6_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down1$ = "Y" Then
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    SurvForm.Picture6.Line (XBeg%, 0)-(X, 2130), QBColor(10), BF
    XTemp% = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture6.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      YTmp = 2130 - (Flux!(0, Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          SurvForm.Picture6.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          SurvForm.Picture6.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  Else
  
  X = X / 2850 * (Ra!(0, 120) - Ra!(0, 1)) + Ra!(0, 1)
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  While Ra!(0, Num%) < X And Num% < 120
    Num% = Num% + 1
  Wend
  Hrs% = Int(Abs(Dec!(0, Num%)))
  Mins% = Int((Abs(Dec!(0, Num%)) - Hrs%) * 60)
  Secs% = Int((Abs(Dec!(0, Num%)) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If Dec!(0, Num%) < 0 Then
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
  SurvForm.Refresh

  End If
End Sub

Private Sub Picture7_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down2$ = "N" And Button = 1 Then
    Down2$ = "Y"
    XBeg% = X
    Down1$ = "N"
    SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture6.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If Y >= 0 And Y <= 2130 Then
        If Check%(Num%) = -1 Then
          SurvForm.Picture6.PSet (X, Y), QBColor(7)
        Else
          SurvForm.Picture6.Circle (X, Y), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  ElseIf Down2$ = "Y" And Button = 2 Then
    Down2$ = "N"
    SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture7.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If Y >= 0 And Y <= 2130 Then
        If Check%(Num%) = -1 Then
          SurvForm.Picture7.PSet (X, Y), QBColor(7)
        Else
          SurvForm.Picture7.Circle (X, Y), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  ElseIf CutSeg$ = "Y" And Down2$ = "Y" And Button = 1 Then
    Down2$ = "N"
    MinMem = MinFlux2
    MaxMem = MaxFlux2
    MinFlux2 = 100
    MaxFlux2 = -100
    For Num% = 121 To 240
      XTemp% = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      If Abs(XTemp% - XBeg%) <= Abs(X - XBeg%) And Abs(XTemp% - X) <= Abs(X - XBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux!(0, Num%) < MinFlux2 Then
          MinFlux2 = Flux!(0, Num%)
        End If
        If Flux!(0, Num%) > MaxFlux2 Then
          MaxFlux2 = Flux!(0, Num%)
        End If
      End If
    Next
    If MinFlux2 = 100 Or MaxFlux2 = -100 Or MinFlux2 = MaxFlux2 Then
      MinFlux2 = MinMem
      MaxFlux2 = MaxMem
    End If
    SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
    SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture7.Line (X, 0)-(X, 2145), QBColor(8)
    SurvForm.Picture9.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If Check%(Num%) = -1 Then
        If Y >= 0 And Y <= 2130 Then
          SurvForm.Picture7.PSet (X, Y), QBColor(7)
        End If
        Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
        SurvForm.Picture9.PSet (X, Y), QBColor(7)
      Else
        If Y >= 0 And Y <= 2130 Then
          SurvForm.Picture7.Circle (X, Y), 15, QBColor(12)
        End If
        Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
        SurvForm.Picture9.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh

    CalA = 0
    CalB = 0
    Tot1% = 0
    Tot2% = 0
    For Num% = 121 To 180
      If Check%(Num%) <> -1 Then
        CalA = CalA + Flux!(0, Num%)
        Tot1% = Tot1% + 1
      End If
    Next
    For Num% = 181 To 240
      If Check%(Num%) <> -1 Then
        CalB = CalB + Flux!(0, Num%)
        Tot2% = Tot2% + 1
      End If
    Next
    SurvForm.FontTransparent = 0
    CurrentY = 3525
    CurrentX = 6960
    Print "                        "
    SurvForm.FontTransparent = -1
    CurrentY = 3525
    CurrentX = 6960
    If Tot1% > 0 And Tot2% > 0 Then
      CalA = CalA / Tot1%
      CalB = CalB / Tot2%
      Cal2 = CalA - CalB
      Print "Terminal: "; Format$(Cal2, "#.###"); " V"
    Else
      Print "Terminal"
      SurvForm.Check2.Value = 0
      SurvForm.Check2.Enabled = 0
      If SurvForm.Check1.Value = 0 And SurvForm.Check2.Value = 0 Then
        SurvForm.Command8.Enabled = 0
        CurrentY = 3960
        CurrentX = 6720
        Print "Input Calibration:"
        SurvForm.Text1.Text = ""
        SurvForm.Text1.Visible = -1
        SurvForm.Text1.SetFocus
      End If
    End If
    SurvForm.Refresh
  End If
End Sub

Private Sub Picture7_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CutSeg$ = "Y" And Down2$ = "Y" Then
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
    SurvForm.Picture7.Line (XBeg%, 0)-(X, 2130), QBColor(10), BF
    XTemp% = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture7.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 121 To 240
      XTemp% = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      YTmp = 2130 - (Flux!(0, Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If YTmp >= 0 And YTmp <= 2130 Then
        YTemp% = YTmp
        If Check%(Num%) = -1 Then
          SurvForm.Picture7.PSet (XTemp%, YTemp%), QBColor(7)
        Else
          SurvForm.Picture7.Circle (XTemp%, YTemp%), 15, QBColor(12)
        End If
      End If
    Next
    SurvForm.Refresh
  Else
  
  X = X / 2850 * (Ra!(0, 240) - Ra!(0, 121)) + Ra!(0, 121)
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  Num% = 121
  While Ra!(0, Num%) < X And Num% < 240
    Num% = Num% + 1
  Wend
  Hrs% = Int(Abs(Dec!(0, Num%)))
  Mins% = Int((Abs(Dec!(0, Num%)) - Hrs%) * 60)
  Secs% = Int((Abs(Dec!(0, Num%)) - Hrs% - Mins% / 60) * 3600)
  CurrentX = 6720
  Print "Dec: ";
  If Dec!(0, Num%) < 0 Then
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
  SurvForm.Refresh

  End If
End Sub

Private Sub Picture8_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down3$ = "N" And Button = 1 Then
    Down3$ = "Y"
    YBeg% = Y
    Down4$ = "N"
    SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture9.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture9.PSet (X, Y), QBColor(7)
      Else
        SurvForm.Picture9.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  ElseIf Down3$ = "Y" And Button = 2 Then
    Down3$ = "N"
    SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture8.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture8.PSet (X, Y), QBColor(7)
      Else
        SurvForm.Picture8.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  ElseIf SelSeg$ = "Y" And Down3$ = "Y" And Button = 1 Then
    Down3$ = "N"
    MinMem = MinFlux1
    MaxMem = MaxFlux1
    MinFlux1 = 100
    MaxFlux1 = -100
    For Num% = 1 To 120
      YTemp% = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If (YTemp% > Y And Y >= YBeg%) Or (YTemp% < YBeg% And Y >= YBeg%) Or (YTemp% < Y And Y <= YBeg%) Or (YTemp% > YBeg% And Y <= YBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux!(0, Num%) < MinFlux1 Then
          MinFlux1 = Flux!(0, Num%)
        End If
        If Flux!(0, Num%) > MaxFlux1 Then
          MaxFlux1 = Flux!(0, Num%)
        End If
      End If
    Next
    If MinFlux1 = 100 Or MaxFlux1 = -100 Or MinFlux1 = MaxFlux1 Then
      MinFlux1 = MinMem
      MaxFlux1 = MaxMem
    End If
    SurvForm.Picture6.Line (0, 0)-(2850, 2130), QBColor(15), BF
    SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture6.Line (X, 0)-(X, 2145), QBColor(8)
    SurvForm.Picture8.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux1) / (MaxFlux1 - MinFlux1) * 2130
      If Check%(Num%) = -1 Then
        If Y >= 0 And Y <= 2130 Then
          SurvForm.Picture6.PSet (X, Y), QBColor(7)
        End If
        Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
        SurvForm.Picture8.PSet (X, Y), QBColor(7)
      Else
        If Y >= 0 And Y <= 2130 Then
          SurvForm.Picture6.Circle (X, Y), 15, QBColor(12)
        End If
        Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
        SurvForm.Picture8.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh

    CalA = 0
    CalB = 0
    Tot1% = 0
    Tot2% = 0
    For Num% = 1 To 60
      If Check%(Num%) <> -1 Then
        CalA = CalA + Flux!(0, Num%)
        Tot1% = Tot1% + 1
      End If
    Next
    For Num% = 61 To 120
      If Check%(Num%) <> -1 Then
        CalB = CalB + Flux!(0, Num%)
        Tot2% = Tot2% + 1
      End If
    Next
    SurvForm.FontTransparent = 0
    CurrentY = 3285
    CurrentX = 6960
    Print "                        "
    SurvForm.FontTransparent = -1
    CurrentY = 3285
    CurrentX = 6960
    If Tot1% > 0 And Tot2% > 0 Then
      CalA = CalA / Tot1%
      CalB = CalB / Tot2%
      Cal1 = CalA - CalB
      Print "Initial: "; Format$(Cal1, "#.###"); " V"
    Else
      Print "Initial"
      SurvForm.Check1.Value = 0
      SurvForm.Check1.Enabled = 0
      If SurvForm.Check1.Value = 0 And SurvForm.Check2.Value = 0 Then
        SurvForm.Command8.Enabled = 0
        CurrentY = 3960
        CurrentX = 6720
        Print "Input Calibration:"
        SurvForm.Text1.Text = ""
        SurvForm.Text1.Visible = -1
        SurvForm.Text1.SetFocus
      End If
    End If
    SurvForm.Refresh
  End If
End Sub

Private Sub Picture8_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down3$ = "Y" Then
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
    SurvForm.Picture8.Line (0, YBeg%)-(2850, Y), QBColor(14), BF
    XTemp% = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture8.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 1 To 120
      XTemp% = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      YTemp% = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture8.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        SurvForm.Picture8.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  Else
  
  X = X / 2850 * (Ra!(0, 120) - Ra!(0, 1)) + Ra!(0, 1)
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  While Ra!(0, Num%) < X
    Num% = Num% + 1
  Wend
  Print "Flux: ";
  If Abs(Flux!(0, Num%)) < 0.0005 Then
    Print "0";
  Else
    If Flux!(0, Num%) < 0 Then
      Print "-";
    End If
    Print Format$(Abs(Flux!(0, Num%)), "#.###"); " V"
  End If
  SurvForm.Refresh

  End If
End Sub

Private Sub Picture9_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down4$ = "N" And Button = 1 Then
    Down4$ = "Y"
    YBeg% = Y
    Down3$ = "N"
    SurvForm.Picture8.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 60) + Ra!(0, 61)) / 2 - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
    SurvForm.Picture8.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 1 To 120
      X = (Ra!(0, Num%) - Ra!(0, 1)) / (Ra!(0, 120) - Ra!(0, 1)) * 2850
      Y = 2130 - (Dec!(0, Num%) - MinDec1) / (MaxDec1 - MinDec1) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture8.PSet (X, Y), QBColor(7)
      Else
        SurvForm.Picture8.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  ElseIf Down4$ = "Y" And Button = 2 Then
    Down4$ = "N"
    SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture9.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture9.PSet (X, Y), QBColor(7)
      Else
        SurvForm.Picture9.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  ElseIf SelSeg$ = "Y" And Down4$ = "Y" And Button = 1 Then
    Down4$ = "N"
    MinMem = MinFlux2
    MaxMem = MaxFlux2
    MinFlux2 = 100
    MaxFlux2 = -100
    For Num% = 121 To 240
      YTemp% = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If (YTemp% > Y And Y >= YBeg%) Or (YTemp% < YBeg% And Y >= YBeg%) Or (YTemp% < Y And Y <= YBeg%) Or (YTemp% > YBeg% And Y <= YBeg%) Then
        Check%(Num%) = -1
      End If
      If Check%(Num%) <> -1 Then
        If Flux!(0, Num%) < MinFlux2 Then
          MinFlux2 = Flux!(0, Num%)
        End If
        If Flux!(0, Num%) > MaxFlux2 Then
          MaxFlux2 = Flux!(0, Num%)
        End If
      End If
    Next
    If MinFlux2 = 100 Or MaxFlux2 = -100 Or MinFlux2 = MaxFlux2 Then
      MinFlux2 = MinMem
      MaxFlux2 = MaxMem
    End If
    SurvForm.Picture7.Line (0, 0)-(2850, 2130), QBColor(15), BF
    SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
    X = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture7.Line (X, 0)-(X, 2145), QBColor(8)
    SurvForm.Picture9.Line (X, 0)-(X, 2145), QBColor(8)
    For Num% = 121 To 240
      X = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      Y = 2130 - (Flux!(0, Num%) - MinFlux2) / (MaxFlux2 - MinFlux2) * 2130
      If Check%(Num%) = -1 Then
        If Y >= 0 And Y <= 2130 Then
          SurvForm.Picture7.PSet (X, Y), QBColor(7)
        End If
        Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
        SurvForm.Picture9.PSet (X, Y), QBColor(7)
      Else
        If Y >= 0 And Y <= 2130 Then
          SurvForm.Picture7.Circle (X, Y), 15, QBColor(12)
        End If
        Y = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
        SurvForm.Picture9.Circle (X, Y), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh

    CalA = 0
    CalB = 0
    Tot1% = 0
    Tot2% = 0
    For Num% = 121 To 180
      If Check%(Num%) <> -1 Then
        CalA = CalA + Flux!(0, Num%)
        Tot1% = Tot1% + 1
      End If
    Next
    For Num% = 181 To 240
      If Check%(Num%) <> -1 Then
        CalB = CalB + Flux!(0, Num%)
        Tot2% = Tot2% + 1
      End If
    Next
    SurvForm.FontTransparent = 0
    CurrentY = 3525
    CurrentX = 6960
    Print "                        "
    SurvForm.FontTransparent = -1
    CurrentY = 3525
    CurrentX = 6960
    If Tot1% > 0 And Tot2% > 0 Then
      CalA = CalA / Tot1%
      CalB = CalB / Tot2%
      Cal2 = CalA - CalB
      Print "Terminal: "; Format$(Cal2, "#.###"); " V"
    Else
      Print "Terminal"
      SurvForm.Check2.Value = 0
      SurvForm.Check2.Enabled = 0
      If SurvForm.Check1.Value = 0 And SurvForm.Check2.Value = 0 Then
        SurvForm.Command8.Enabled = 0
        CurrentY = 3960
        CurrentX = 6720
        Print "Input Calibration:"
        SurvForm.Text1.Text = ""
        SurvForm.Text1.Visible = -1
        SurvForm.Text1.SetFocus
      End If
    End If
    SurvForm.Refresh
  End If
End Sub

Private Sub Picture9_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If SelSeg$ = "Y" And Down4$ = "Y" Then
    SurvForm.FontTransparent = 0
    CurrentY = 4680
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    CurrentX = 6720
    Print "                       "
    SurvForm.FontTransparent = -1
    SurvForm.Refresh
    SurvForm.Picture9.Line (0, 0)-(2850, 2130), QBColor(15), BF
    SurvForm.Picture9.Line (0, YBeg%)-(2850, Y), QBColor(14), BF
    XTemp% = ((Ra!(0, 180) + Ra!(0, 181)) / 2 - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
    SurvForm.Picture9.Line (XTemp%, 0)-(XTemp%, 2145), QBColor(8)
    For Num% = 121 To 240
      XTemp% = (Ra!(0, Num%) - Ra!(0, 121)) / (Ra!(0, 240) - Ra!(0, 121)) * 2850
      YTemp% = 2130 - (Dec!(0, Num%) - MinDec2) / (MaxDec2 - MinDec2) * 2130
      If Check%(Num%) = -1 Then
        SurvForm.Picture9.PSet (XTemp%, YTemp%), QBColor(7)
      Else
        SurvForm.Picture9.Circle (XTemp%, YTemp%), 15, QBColor(9)
      End If
    Next
    SurvForm.Refresh
  Else
  
  X = X / 2850 * (Ra!(0, 240) - Ra!(0, 121)) + Ra!(0, 121)
  Hrs% = Int(X / 3600)
  Mins% = Int((X - Hrs% * 3600!) / 60)
  Secs% = Int(X - Hrs% * 3600! - Mins% * 60)
  SurvForm.FontTransparent = 0
  CurrentY = 4680
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  CurrentX = 6720
  Print "                       "
  SurvForm.FontTransparent = -1
  CurrentY = 4680
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
  Num% = 121
  While Ra!(0, Num%) < X
    Num% = Num% + 1
  Wend
  Print "Flux: ";
  If Abs(Flux!(0, Num%)) < 0.0005 Then
    Print "0";
  Else
    If Flux!(0, Num%) < 0 Then
      Print "-";
    End If
    Print Format$(Abs(Flux!(0, Num%)), "#.###"); " V"
  End If
  SurvForm.Refresh

  End If
End Sub

Private Sub Text1_Change()
  SurvForm.Text1.Text = Str$(Val(SurvForm.Text1.Text))
  If SurvForm.Text1.Visible = 0 Then
    SurvForm.Text1.Text = ""
  End If
  If Val(SurvForm.Text1.Text) <> 0 Then
    SurvForm.Command8.Enabled = -1
  Else
    SurvForm.Command8.Enabled = 0
  End If
  SurvForm.Refresh
End Sub

Private Sub Timer1_Timer()
End Sub

