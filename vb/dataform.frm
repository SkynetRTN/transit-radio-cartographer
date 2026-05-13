VERSION 5.00
Begin VB.Form DataForm 
   Appearance      =   0  'Flat
   AutoRedraw      =   -1  'True
   BackColor       =   &H80000005&
   BorderStyle     =   3  'Fixed Dialog
   Caption         =   "Palette"
   ClientHeight    =   5055
   ClientLeft      =   1425
   ClientTop       =   1650
   ClientWidth     =   6735
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
   PaletteMode     =   1  'UseZOrder
   ScaleHeight     =   5055
   ScaleWidth      =   6735
   Visible         =   0   'False
   Begin VB.PictureBox Picture9 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   495
      Left            =   240
      Picture         =   "dataform.frx":0000
      ScaleHeight     =   465
      ScaleWidth      =   6225
      TabIndex        =   18
      Top             =   3840
      Width           =   6255
   End
   Begin VB.PictureBox Picture8 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   495
      Left            =   240
      Picture         =   "dataform.frx":0446
      ScaleHeight     =   465
      ScaleWidth      =   6225
      TabIndex        =   17
      Top             =   3360
      Width           =   6255
   End
   Begin VB.PictureBox Picture7 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   495
      Left            =   240
      Picture         =   "dataform.frx":088C
      ScaleHeight     =   465
      ScaleWidth      =   6225
      TabIndex        =   16
      Top             =   2880
      Width           =   6255
   End
   Begin VB.Frame Frame1 
      Appearance      =   0  'Flat
      BackColor       =   &H00FFFFFF&
      Caption         =   "Color"
      ForeColor       =   &H80000008&
      Height          =   1095
      Left            =   240
      TabIndex        =   14
      Top             =   1680
      Width           =   1935
      Begin VB.PictureBox Picture6 
         Appearance      =   0  'Flat
         AutoRedraw      =   -1  'True
         BackColor       =   &H80000005&
         ForeColor       =   &H80000008&
         Height          =   615
         Left            =   120
         Picture         =   "dataform.frx":0CD2
         ScaleHeight     =   585
         ScaleWidth      =   1665
         TabIndex        =   15
         Top             =   360
         Width           =   1695
      End
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Height          =   285
      Left            =   720
      TabIndex        =   13
      Top             =   480
      Width           =   1455
   End
   Begin VB.Frame Frame2 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "Color Components"
      ForeColor       =   &H80000008&
      Height          =   2655
      Left            =   2400
      TabIndex        =   9
      Top             =   120
      Width           =   2055
      Begin VB.PictureBox Picture5 
         Appearance      =   0  'Flat
         AutoRedraw      =   -1  'True
         BackColor       =   &H80000005&
         ForeColor       =   &H80000008&
         Height          =   2175
         Left            =   1440
         Picture         =   "dataform.frx":1118
         ScaleHeight     =   2145
         ScaleWidth      =   465
         TabIndex        =   12
         Top             =   360
         Width           =   495
      End
      Begin VB.PictureBox Picture4 
         Appearance      =   0  'Flat
         AutoRedraw      =   -1  'True
         BackColor       =   &H80000005&
         ForeColor       =   &H80000008&
         Height          =   2175
         Left            =   780
         Picture         =   "dataform.frx":155E
         ScaleHeight     =   2145
         ScaleWidth      =   465
         TabIndex        =   11
         Top             =   360
         Width           =   495
      End
      Begin VB.PictureBox Picture3 
         Appearance      =   0  'Flat
         AutoRedraw      =   -1  'True
         BackColor       =   &H80000005&
         ForeColor       =   &H80000008&
         Height          =   2175
         Left            =   120
         Picture         =   "dataform.frx":19A4
         ScaleHeight     =   2145
         ScaleWidth      =   465
         TabIndex        =   10
         Top             =   360
         Width           =   495
      End
   End
   Begin VB.CheckBox Check1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "Original Flux Range"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   240
      TabIndex        =   8
      Top             =   1260
      Value           =   1  'Checked
      Width           =   2055
   End
   Begin VB.PictureBox Picture1 
      Appearance      =   0  'Flat
      AutoRedraw      =   -1  'True
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   495
      Left            =   240
      Picture         =   "dataform.frx":1DEA
      ScaleHeight     =   465
      ScaleWidth      =   6225
      TabIndex        =   7
      Top             =   4440
      Width           =   6255
   End
   Begin VB.CommandButton Command4 
      Appearance      =   0  'Flat
      Caption         =   "Save Palette As"
      Height          =   495
      Left            =   4680
      TabIndex        =   4
      Top             =   2160
      Width           =   1815
   End
   Begin VB.CommandButton Command3 
      Appearance      =   0  'Flat
      Caption         =   "Open Palette"
      Height          =   495
      Left            =   4680
      TabIndex        =   5
      Top             =   1560
      Width           =   1815
   End
   Begin VB.TextBox Text2 
      Appearance      =   0  'Flat
      Height          =   285
      Left            =   720
      TabIndex        =   6
      Top             =   840
      Width           =   1455
   End
   Begin VB.CommandButton Command2 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   4680
      TabIndex        =   3
      Top             =   720
      Width           =   1815
   End
   Begin VB.CommandButton Command1 
      Appearance      =   0  'Flat
      Caption         =   "OK"
      Height          =   495
      Left            =   4680
      TabIndex        =   2
      Top             =   120
      Width           =   1815
   End
   Begin VB.Label Label1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   360
      TabIndex        =   19
      Top             =   3000
      Visible         =   0   'False
      Width           =   255
   End
   Begin VB.Label CalSlope 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   4680
      TabIndex        =   1
      Top             =   3720
      Visible         =   0   'False
      Width           =   1215
   End
   Begin VB.Label CalName 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   4680
      TabIndex        =   0
      Top             =   3000
      Visible         =   0   'False
      Width           =   1215
   End
End
Attribute VB_Name = "DataForm"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim Pal!(100, 4)
Dim MinFluxI
Dim MinFluxPI
Dim MaxFluxI
Dim MaxFluxPI
Dim PalNum%
Dim Stp$
Dim Press%
Dim XTmp
Dim Freeze$
Dim CntMem%

Private Sub Check1_Click()
  If (DataForm.Visible = 0) Or (Stp$ = "Y") Then
    Stp$ = "N"
  Else
    If Check1.Value = 1 Then
      MinFluxI = MinFluxPI
      MaxFluxI = MaxFluxPI
      If DataForm.CalSlope.Caption = "" Then
        Stp$ = "Y"
        Text1.Text = Str$(MinFluxI)
        Stp$ = "Y"
        Text2.Text = Str$(MaxFluxI)
        Stp$ = "N"
      Else
        Length% = Len(DataForm.CalSlope.Caption)
        Stp$ = "Y"
        Text1.Text = Str$(MinFluxI * Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10)))
        Stp$ = "Y"
        Text2.Text = Str$(MaxFluxI * Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10)))
        Stp$ = "N"
      End If
    Else
      Check1.Value = 1
    End If
  End If
End Sub

Private Sub Command1_Click()
  DataForm.Hide
  SurvForm.Refresh
  Junk$ = Str$(MinFluxPI) + " " + Str$(MaxFluxPI) + " " + Str$(MinFluxI) + " " + Str$(MaxFluxI) + " " + Str$(PalNum%) + " "
  For Cnt% = 1 To PalNum%
    For Num% = 1 To 4
      Junk$ = Junk$ + Str$(Pal!(Cnt%, Num%)) + " "
    Next
  Next
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
  Num% = Int((Pal!(PalNum%, 1) - 1) / 254 * 414) * 15
  DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Refresh
  Freeze$ = "N"
  If SurvForm.Label8.Caption <> Junk$ Then
    SurvForm.Label9.Caption = "Y"
  End If
  SurvForm.Label8.Caption = Junk$
End Sub

Private Sub Command2_Click()
  DataForm.Command1.SetFocus
  DataForm.Hide
  SurvForm.Refresh
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
  Num% = Int((Pal!(PalNum%, 1) - 1) / 254 * 414) * 15
  DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Refresh
  Freeze$ = "N"
End Sub

Private Sub Command3_Click()
  Load LoadData
  LoadData.Caption = "Open Palette"
  LoadData.Label2.Caption = "*.pal"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.pal"
  LoadData.Show 1
  DataForm.Refresh
  If LoadData.Caption = "show" Then
    
  Open LoadData.File1.filename For Input As #1
  Line Input #1, Junk$
  Close #1
  Length% = Len(Junk$)
  Junk$ = Right$(Junk$, Length% - 1)
  Temp$ = ""
  While Left$(Junk$, 1) <> " "
    Temp$ = Temp$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  PalNum% = Val(Temp$)
  Length% = Len(Junk$)
  Junk$ = Right$(Junk$, Length% - 2)
  For Cnt% = 1 To PalNum%
    For Num% = 1 To 4
      Temp$ = ""
      While Left$(Junk$, 1) <> " "
        Temp$ = Temp$ + Left$(Junk$, 1)
        Length% = Len(Junk$)
        Junk$ = Right$(Junk$, Length% - 1)
      Wend
      Pal!(Cnt%, Num%) = Val(Temp$)
      Length% = Len(Junk$)
      If (Cnt% <> PalNum%) Or (Num% <> 4) Then
        Junk$ = Right$(Junk$, Length% - 2)
      End If
    Next
  Next
  If DataForm.CalSlope.Caption = "" Then
    DataForm.Text1.Text = Str$(MinFluxI)
  Else
    Length% = Len(DataForm.CalSlope.Caption)
    Y = Abs(MinFluxI) * Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    DataForm.Text1.Text = Str$(Y)
  End If
  If DataForm.CalSlope.Caption = "" Then
    DataForm.Text2.Text = Str$(MaxFluxI)
  Else
    Length% = Len(DataForm.CalSlope.Caption)
    Y = Abs(MaxFluxI) * Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    DataForm.Text2.Text = Str$(Y)
  End If
  If DataForm.CalSlope.Caption = "" Then
    DataForm.FontTransparent = 0
    CurrentY = 180
    CurrentX = 240
    Print "                              "
    DataForm.FontTransparent = -1
    CurrentY = 180
    CurrentX = 240
    Print "Flux Range (V)"
  Else
    DataForm.FontTransparent = 0
    CurrentY = 180
    CurrentX = 240
    Print "                              "
    DataForm.FontTransparent = -1
    CurrentY = 180
    CurrentX = 240
    Print "Flux Range (Jy)"
  End If
  If (MinFluxI = MinFluxPI) And (MaxFluxI = MaxFluxPI) Then
    If DataForm.Check1.Value = 0 Then
      Stp$ = "Y"
    End If
    DataForm.Check1.Value = 1
  Else
    If DataForm.Check1.Value = 1 Then
      Stp$ = "Y"
    End If
    DataForm.Check1.Value = 0
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
  Num% = Int((Pal!(PalNum%, 1) - 1) / 254 * 414) * 15
  DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
  DataForm.Refresh
  Freeze$ = "N"
  
  End If
  Unload LoadData
End Sub

Private Sub Command4_Click()
  Load LoadData
  LoadData.Caption = "Save Palette As"
  LoadData.Text1.Enabled = -1
  LoadData.Text1.Visible = -1
  LoadData.File1.Enabled = 0
  LoadData.Text1.Text = "palette.pal"
  LoadData.Label4.Caption = LoadData.Dir1.Path
  LoadData.File1.Pattern = "*.*"
  LoadData.Show 1
  DataForm.Refresh
  If LoadData.Caption = "save" Then
    Open LoadData.Text1.Text For Output As #1
    Junk$ = Str$(PalNum%) + " "
    For Cnt% = 1 To PalNum%
      For Num% = 1 To 4
        Junk$ = Junk$ + Str$(Pal!(Cnt%, Num%)) + " "
      Next
    Next
    Print #1, Junk$
    Close #1
  End If
  Unload LoadData
End Sub

Private Sub Form_Load()
  CntMem% = 0
  CurrentY = 540
  CurrentX = 240
  Print "Min:"
  CurrentY = 900
  CurrentX = 240
  Print "Max:"
End Sub

Private Sub Form_LostFocus()
  Picture6.Line (0, 0)-(1650, 570), RGB(255, 255, 255), BF
  Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
End Sub

Private Sub Label1_Change()
  If SurvForm.Label8.Caption <> "" Then
  
  Junk$ = SurvForm.Label8.Caption
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  Temp$ = ""
  While Left$(Junk$, 1) <> " "
    Temp$ = Temp$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  MinFluxPI = Val(Temp$)
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  Temp$ = ""
  While Left$(Junk$, 1) <> " "
    Temp$ = Temp$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  MaxFluxPI = Val(Temp$)
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  Temp$ = ""
  While Left$(Junk$, 1) <> " "
    Temp$ = Temp$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  MinFluxI = Val(Temp$)
  Length% = Len(Junk$)
  While Left$(Junk$, 1) = " "
    Junk$ = Right$(Junk$, Length% - 1)
    Length% = Len(Junk$)
  Wend
  Temp$ = ""
  While Left$(Junk$, 1) <> " "
    Temp$ = Temp$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  MaxFluxI = Val(Temp$)
  Length% = Len(Junk$)
  Junk$ = Right$(Junk$, Length% - 2)
  Temp$ = ""
  While Left$(Junk$, 1) <> " "
    Temp$ = Temp$ + Left$(Junk$, 1)
    Length% = Len(Junk$)
    Junk$ = Right$(Junk$, Length% - 1)
  Wend
  PalNum% = Val(Temp$)
  Length% = Len(Junk$)
  Junk$ = Right$(Junk$, Length% - 2)
  For Cnt% = 1 To PalNum%
    For Num% = 1 To 4
      Temp$ = ""
      While Left$(Junk$, 1) <> " "
        Temp$ = Temp$ + Left$(Junk$, 1)
        Length% = Len(Junk$)
        Junk$ = Right$(Junk$, Length% - 1)
      Wend
      Pal!(Cnt%, Num%) = Val(Temp$)
      Length% = Len(Junk$)
      If (Cnt% <> PalNum%) Or (Num% <> 4) Then
        Junk$ = Right$(Junk$, Length% - 2)
      End If
    Next
  Next
  Stp$ = "Y"
  If DataForm.CalSlope.Caption = "" Then
    DataForm.Text1.Text = Str$(MinFluxI)
  Else
    Length% = Len(DataForm.CalSlope.Caption)
    Y = MinFluxI * Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    DataForm.Text1.Text = Str$(Y)
  End If
  Stp$ = "Y"
  If DataForm.CalSlope.Caption = "" Then
    DataForm.Text2.Text = Str$(MaxFluxI)
  Else
    Length% = Len(DataForm.CalSlope.Caption)
    Y = MaxFluxI * Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    DataForm.Text2.Text = Str$(Y)
  End If
  Stp$ = "N"
  If DataForm.CalSlope.Caption = "" Then
    DataForm.FontTransparent = 0
    CurrentY = 180
    CurrentX = 240
    Print "                              "
    DataForm.FontTransparent = -1
    CurrentY = 180
    CurrentX = 240
    Print "Flux Range"
  Else
    DataForm.FontTransparent = 0
    CurrentY = 180
    CurrentX = 240
    Print "                              "
    DataForm.FontTransparent = -1
    CurrentY = 180
    CurrentX = 240
    Print "Flux Range (Jy)"
  End If
  Stp$ = "Y"
  If (MinFluxI = MinFluxPI) And (MaxFluxI = MaxFluxPI) Then
    DataForm.Check1.Value = 1
  Else
    DataForm.Check1.Value = 0
  End If
  Stp$ = "N"

  End If
End Sub

Private Sub Picture1_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If Freeze$ <> "Y" Then

  XTmp = Int(X / 6210 * 254 + 1)
  Cnt% = 2
  While (Pal!(Cnt%, 1) <= XTmp) And (Cnt% < PalNum%)
    Cnt% = Cnt% + 1
  Wend
  Red% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
  Green% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
  Blue% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
  If Red% < 0 Then
    Red% = 0
  ElseIf Red% > 255 Then
    Red% = 255
  End If
  If Green% < 0 Then
    Green% = 0
  ElseIf Green% > 255 Then
    Green% = 255
  End If
  If Blue% < 0 Then
    Blue% = 0
  ElseIf Blue% > 255 Then
    Blue% = 255
  End If
  Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
  Red% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
  Green% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
  Blue% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
  Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
  Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
  Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  DataForm.Refresh

  End If
End Sub

Private Sub Picture3_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CntMem% <> 0 Then
    Pal!(CntMem%, 2) = (2130 - Y) / 2130 * 255
    If CntMem% = 1 Then
      Num1% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
    ElseIf CntMem% = PalNum% Then
      Num1% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    Else
      Num1% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
    End If
    DataForm.Picture7.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    If CntMem% = 1 Then
      Num1% = CntMem% + 1
      Num2% = CntMem% + 1
    ElseIf CntMem% = PalNum% Then
      Num1% = CntMem%
      Num2% = CntMem%
    Else
      Num1% = CntMem%
      Num2% = CntMem% + 1
    End If
    For Cnt% = Num1% To Num2%
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
    Next
    If CntMem% <> 1 Then
      Num% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    End If
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    If CntMem% <> PalNum% Then
      Num% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    End If
      Red% = Pal!(CntMem%, 2)
      Green% = Pal!(CntMem%, 3)
      Blue% = Pal!(CntMem%, 4)
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = Pal!(CntMem%, 2) / 255 * 2130
      Green% = Pal!(CntMem%, 3) / 255 * 2130
      Blue% = Pal!(CntMem%, 4) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  End If
  DataForm.Refresh
End Sub

Private Sub Picture4_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CntMem% <> 0 Then
    Pal!(CntMem%, 3) = (2130 - Y) / 2130 * 255
    If CntMem% = 1 Then
      Num1% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
    ElseIf CntMem% = PalNum% Then
      Num1% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    Else
      Num1% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
    End If
    DataForm.Picture7.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    If CntMem% = 1 Then
      Num1% = CntMem% + 1
      Num2% = CntMem% + 1
    ElseIf CntMem% = PalNum% Then
      Num1% = CntMem%
      Num2% = CntMem%
    Else
      Num1% = CntMem%
      Num2% = CntMem% + 1
    End If
    For Cnt% = Num1% To Num2%
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
    Next
    If CntMem% <> 1 Then
      Num% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    End If
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    If CntMem% <> PalNum% Then
      Num% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    End If
      Red% = Pal!(CntMem%, 2)
      Green% = Pal!(CntMem%, 3)
      Blue% = Pal!(CntMem%, 4)
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = Pal!(CntMem%, 2) / 255 * 2130
      Green% = Pal!(CntMem%, 3) / 255 * 2130
      Blue% = Pal!(CntMem%, 4) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  End If
  DataForm.Refresh
End Sub

Private Sub Picture5_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If CntMem% <> 0 Then
    Pal!(CntMem%, 4) = (2130 - Y) / 2130 * 255
    If CntMem% = 1 Then
      Num1% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
    ElseIf CntMem% = PalNum% Then
      Num1% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    Else
      Num1% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      Num2% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
    End If
    DataForm.Picture7.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    If CntMem% = 1 Then
      Num1% = CntMem% + 1
      Num2% = CntMem% + 1
    ElseIf CntMem% = PalNum% Then
      Num1% = CntMem%
      Num2% = CntMem%
    Else
      Num1% = CntMem%
      Num2% = CntMem% + 1
    End If
    For Cnt% = Num1% To Num2%
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
    Next
    If CntMem% <> 1 Then
      Num% = Int((Pal!(CntMem% - 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    End If
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
    If CntMem% <> PalNum% Then
      Num% = Int((Pal!(CntMem% + 1, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    End If
      Red% = Pal!(CntMem%, 2)
      Green% = Pal!(CntMem%, 3)
      Blue% = Pal!(CntMem%, 4)
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = Pal!(CntMem%, 2) / 255 * 2130
      Green% = Pal!(CntMem%, 3) / 255 * 2130
      Blue% = Pal!(CntMem%, 4) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  End If
  DataForm.Refresh
End Sub

Private Sub Picture7_Click()
  If Press% = 1 Then
    If CntMem% <> 0 Then
      Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      CntMem% = 0
    End If
    Cnt% = 1
    While (CntMem% = 0) And (Cnt% <= PalNum%)
      Num% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
      If (XTmp >= Num% - 15) And (XTmp <= Num% + 15) Then
        CntMem% = Cnt%
      End If
      Cnt% = Cnt% + 1
    Wend
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    If CntMem% <> 0 Then
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      Red% = Pal!(CntMem%, 2)
      Green% = Pal!(CntMem%, 3)
      Blue% = Pal!(CntMem%, 4)
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = Pal!(CntMem%, 2) / 255 * 2130
      Green% = Pal!(CntMem%, 3) / 255 * 2130
      Blue% = Pal!(CntMem%, 4) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
    Else
      Cnt% = 1
      While Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15 < XTmp
        Cnt% = Cnt% + 1
      Wend
      Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
      Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
      Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
      If Red% < 0 Then
        Red% = 0
      ElseIf Red% > 255 Then
        Red% = 255
      End If
      If Green% < 0 Then
        Green% = 0
      ElseIf Green% > 255 Then
        Green% = 255
      End If
      If Blue% < 0 Then
        Blue% = 0
      ElseIf Blue% > 255 Then
        Blue% = 255
      End If
      CntMem% = Cnt%
      For Cnt% = PalNum% To CntMem% Step -1
        For Num% = 1 To 4
          Pal!(Cnt% + 1, Num%) = Pal!(Cnt%, Num%)
        Next
      Next
      PalNum% = PalNum% + 1
      Pal!(CntMem%, 1) = XTmp / 15 / 414 * 254 + 1
      Pal!(CntMem%, 2) = Red%
      Pal!(CntMem%, 3) = Green%
      Pal!(CntMem%, 4) = Blue%
      Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      X = Int(XTmp / 6210 * 254 + 1)
      Cnt% = 2
      While (Pal!(Cnt%, 1) <= X) And (Cnt% < PalNum%)
        Cnt% = Cnt% + 1
      Wend
      Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
      Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
      Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
      If Red% < 0 Then
        Red% = 0
      ElseIf Red% > 255 Then
        Red% = 255
      End If
      If Green% < 0 Then
        Green% = 0
      ElseIf Green% > 255 Then
        Green% = 255
      End If
      If Blue% < 0 Then
        Blue% = 0
      ElseIf Blue% > 255 Then
        Blue% = 255
      End If
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
      Green% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
      Blue% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
    End If
  Else
    Freeze$ = "N"
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    CntMem% = 0
  End If
  DataForm.Refresh
End Sub

Private Sub Picture7_DblClick()
  If (Press% = 1) And (CntMem% <> 1) And (CntMem% <> PalNum%) Then
    Freeze$ = "N"
    For Cnt% = CntMem% To PalNum% - 1
      For Num% = 1 To 4
        Pal!(Cnt%, Num%) = Pal!(Cnt% + 1, Num%)
      Next
    Next
    PalNum% = PalNum% - 1
    Cnt% = CntMem%
    CntMem% = 0
    Num1% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
    Num2% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
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
    Num% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    X = Int(XTmp / 6210 * 254 + 1)
    Cnt% = 2
    While (Pal!(Cnt%, 1) <= X) And (Cnt% < PalNum%)
      Cnt% = Cnt% + 1
    Wend
    Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
    Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
    Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
    If Red% < 0 Then
      Red% = 0
    ElseIf Red% > 255 Then
      Red% = 255
    End If
    If Green% < 0 Then
      Green% = 0
    ElseIf Green% > 255 Then
      Green% = 255
    End If
    If Blue% < 0 Then
      Blue% = 0
    ElseIf Blue% > 255 Then
      Blue% = 255
    End If
    Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
    Red% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
    Green% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
    Blue% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
    Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
    Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
    Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  End If
  DataForm.Refresh
End Sub

Private Sub Picture7_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  Press% = Button
  XTmp = X
  Freeze$ = "Y"
End Sub

Private Sub Picture7_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If Freeze$ <> "Y" Then

  XTmp = Int(X / 6210 * 254 + 1)
  Cnt% = 2
  While (Pal!(Cnt%, 1) <= XTmp) And (Cnt% < PalNum%)
    Cnt% = Cnt% + 1
  Wend
  Red% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
  Green% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
  Blue% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
  If Red% < 0 Then
    Red% = 0
  ElseIf Red% > 255 Then
    Red% = 255
  End If
  If Green% < 0 Then
    Green% = 0
  ElseIf Green% > 255 Then
    Green% = 255
  End If
  If Blue% < 0 Then
    Blue% = 0
  ElseIf Blue% > 255 Then
    Blue% = 255
  End If
  Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
  Red% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
  Green% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
  Blue% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
  Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
  Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
  Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  DataForm.Refresh

  End If
End Sub

Private Sub Picture8_Click()
  If Press% = 1 Then
    If CntMem% <> 0 Then
      Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      CntMem% = 0
    End If
    Cnt% = 1
    While (CntMem% = 0) And (Cnt% <= PalNum%)
      Num% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
      If (XTmp >= Num% - 15) And (XTmp <= Num% + 15) Then
        CntMem% = Cnt%
      End If
      Cnt% = Cnt% + 1
    Wend
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    If CntMem% <> 0 Then
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      Red% = Pal!(CntMem%, 2)
      Green% = Pal!(CntMem%, 3)
      Blue% = Pal!(CntMem%, 4)
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = Pal!(CntMem%, 2) / 255 * 2130
      Green% = Pal!(CntMem%, 3) / 255 * 2130
      Blue% = Pal!(CntMem%, 4) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
    Else
      Cnt% = 1
      While Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15 < XTmp
        Cnt% = Cnt% + 1
      Wend
      Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
      Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
      Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
      If Red% < 0 Then
        Red% = 0
      ElseIf Red% > 255 Then
        Red% = 255
      End If
      If Green% < 0 Then
        Green% = 0
      ElseIf Green% > 255 Then
        Green% = 255
      End If
      If Blue% < 0 Then
        Blue% = 0
      ElseIf Blue% > 255 Then
        Blue% = 255
      End If
      CntMem% = Cnt%
      For Cnt% = PalNum% To CntMem% Step -1
        For Num% = 1 To 4
          Pal!(Cnt% + 1, Num%) = Pal!(Cnt%, Num%)
        Next
      Next
      PalNum% = PalNum% + 1
      Pal!(CntMem%, 1) = XTmp / 15 / 414 * 254 + 1
      Pal!(CntMem%, 2) = Red%
      Pal!(CntMem%, 3) = Green%
      Pal!(CntMem%, 4) = Blue%
      Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      X = Int(XTmp / 6210 * 254 + 1)
      Cnt% = 2
      While (Pal!(Cnt%, 1) <= X) And (Cnt% < PalNum%)
        Cnt% = Cnt% + 1
      Wend
      Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
      Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
      Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
      If Red% < 0 Then
        Red% = 0
      ElseIf Red% > 255 Then
        Red% = 255
      End If
      If Green% < 0 Then
        Green% = 0
      ElseIf Green% > 255 Then
        Green% = 255
      End If
      If Blue% < 0 Then
        Blue% = 0
      ElseIf Blue% > 255 Then
        Blue% = 255
      End If
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
      Green% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
      Blue% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
    End If
  Else
    Freeze$ = "N"
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    CntMem% = 0
  End If
  DataForm.Refresh
End Sub

Private Sub Picture8_DblClick()
  If (Press% = 1) And (CntMem% <> 1) And (CntMem% <> PalNum%) Then
    Freeze$ = "N"
    For Cnt% = CntMem% To PalNum% - 1
      For Num% = 1 To 4
        Pal!(Cnt%, Num%) = Pal!(Cnt% + 1, Num%)
      Next
    Next
    PalNum% = PalNum% - 1
    Cnt% = CntMem%
    CntMem% = 0
    Num1% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
    Num2% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
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
    Num% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    X = Int(XTmp / 6210 * 254 + 1)
    Cnt% = 2
    While (Pal!(Cnt%, 1) <= X) And (Cnt% < PalNum%)
      Cnt% = Cnt% + 1
    Wend
    Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
    Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
    Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
    If Red% < 0 Then
      Red% = 0
    ElseIf Red% > 255 Then
      Red% = 255
    End If
    If Green% < 0 Then
      Green% = 0
    ElseIf Green% > 255 Then
      Green% = 255
    End If
    If Blue% < 0 Then
      Blue% = 0
    ElseIf Blue% > 255 Then
      Blue% = 255
    End If
    Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
    Red% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
    Green% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
    Blue% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
    Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
    Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
    Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  End If
  DataForm.Refresh
End Sub

Private Sub Picture8_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  Press% = Button
  XTmp = X
  Freeze$ = "Y"
End Sub

Private Sub Picture8_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If Freeze$ <> "Y" Then

  XTmp = Int(X / 6210 * 254 + 1)
  Cnt% = 2
  While (Pal!(Cnt%, 1) <= XTmp) And (Cnt% < PalNum%)
    Cnt% = Cnt% + 1
  Wend
  Red% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
  Green% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
  Blue% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
  If Red% < 0 Then
    Red% = 0
  ElseIf Red% > 255 Then
    Red% = 255
  End If
  If Green% < 0 Then
    Green% = 0
  ElseIf Green% > 255 Then
    Green% = 255
  End If
  If Blue% < 0 Then
    Blue% = 0
  ElseIf Blue% > 255 Then
    Blue% = 255
  End If
  Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
  Red% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
  Green% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
  Blue% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
  Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
  Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
  Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  DataForm.Refresh

  End If
End Sub

Private Sub Picture9_Click()
  If Press% = 1 Then
    If CntMem% <> 0 Then
      Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
      CntMem% = 0
    End If
    Cnt% = 1
    While (CntMem% = 0) And (Cnt% <= PalNum%)
      Num% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
      If (XTmp >= Num% - 15) And (XTmp <= Num% + 15) Then
        CntMem% = Cnt%
      End If
      Cnt% = Cnt% + 1
    Wend
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    If CntMem% <> 0 Then
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      Red% = Pal!(CntMem%, 2)
      Green% = Pal!(CntMem%, 3)
      Blue% = Pal!(CntMem%, 4)
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = Pal!(CntMem%, 2) / 255 * 2130
      Green% = Pal!(CntMem%, 3) / 255 * 2130
      Blue% = Pal!(CntMem%, 4) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
    Else
      Cnt% = 1
      While Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15 < XTmp
        Cnt% = Cnt% + 1
      Wend
      Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
      Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
      Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
      If Red% < 0 Then
        Red% = 0
      ElseIf Red% > 255 Then
        Red% = 255
      End If
      If Green% < 0 Then
        Green% = 0
      ElseIf Green% > 255 Then
        Green% = 255
      End If
      If Blue% < 0 Then
        Blue% = 0
      ElseIf Blue% > 255 Then
        Blue% = 255
      End If
      CntMem% = Cnt%
      For Cnt% = PalNum% To CntMem% Step -1
        For Num% = 1 To 4
          Pal!(Cnt% + 1, Num%) = Pal!(Cnt%, Num%)
        Next
      Next
      PalNum% = PalNum% + 1
      Pal!(CntMem%, 1) = XTmp / 15 / 414 * 254 + 1
      Pal!(CntMem%, 2) = Red%
      Pal!(CntMem%, 3) = Green%
      Pal!(CntMem%, 4) = Blue%
      Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
      DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(8), BF
      X = Int(XTmp / 6210 * 254 + 1)
      Cnt% = 2
      While (Pal!(Cnt%, 1) <= X) And (Cnt% < PalNum%)
        Cnt% = Cnt% + 1
      Wend
      Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
      Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
      Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
      If Red% < 0 Then
        Red% = 0
      ElseIf Red% > 255 Then
        Red% = 255
      End If
      If Green% < 0 Then
        Green% = 0
      ElseIf Green% > 255 Then
        Green% = 255
      End If
      If Blue% < 0 Then
        Blue% = 0
      ElseIf Blue% > 255 Then
        Blue% = 255
      End If
      Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
      Red% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
      Green% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
      Blue% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
      Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
      Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
      Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
      Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
    End If
  Else
    Freeze$ = "N"
    Num% = Int((Pal!(CntMem%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    CntMem% = 0
  End If
  DataForm.Refresh
End Sub

Private Sub Picture9_DblClick()
  If (Press% = 1) And (CntMem% <> 1) And (CntMem% <> PalNum%) Then
    Freeze$ = "N"
    For Cnt% = CntMem% To PalNum% - 1
      For Num% = 1 To 4
        Pal!(Cnt%, Num%) = Pal!(Cnt% + 1, Num%)
      Next
    Next
    PalNum% = PalNum% - 1
    Cnt% = CntMem%
    CntMem% = 0
    Num1% = Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 414) * 15
    Num2% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture8.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
    DataForm.Picture9.Line (Num1%, 0)-(Num2%, 465), RGB(255, 255, 255), BF
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
    Num% = Int((Pal!(Cnt%, 1) - 1) / 254 * 414) * 15
    DataForm.Picture7.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture8.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    DataForm.Picture9.Line (Num% - 15, 0)-(Num% + 15, 465), QBColor(7), BF
    X = Int(XTmp / 6210 * 254 + 1)
    Cnt% = 2
    While (Pal!(Cnt%, 1) <= X) And (Cnt% < PalNum%)
      Cnt% = Cnt% + 1
    Wend
    Red% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
    Green% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
    Blue% = (XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
    If Red% < 0 Then
      Red% = 0
    ElseIf Red% > 255 Then
      Red% = 255
    End If
    If Green% < 0 Then
      Green% = 0
    ElseIf Green% > 255 Then
      Green% = 255
    End If
    If Blue% < 0 Then
      Blue% = 0
    ElseIf Blue% > 255 Then
      Blue% = 255
    End If
    Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
    Red% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
    Green% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
    Blue% = ((XTmp - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
    Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
    Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
    Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
    Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  End If
  DataForm.Refresh
End Sub

Private Sub Picture9_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
  Press% = Button
  XTmp = X
  Freeze$ = "Y"
End Sub

Private Sub Picture9_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
  If Freeze$ <> "Y" Then

  XTmp = Int(X / 6210 * 254 + 1)
  Cnt% = 2
  While (Pal!(Cnt%, 1) <= XTmp) And (Cnt% < PalNum%)
    Cnt% = Cnt% + 1
  Wend
  Red% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)
  Green% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)
  Blue% = (X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)
  If Red% < 0 Then
    Red% = 0
  ElseIf Red% > 255 Then
    Red% = 255
  End If
  If Green% < 0 Then
    Green% = 0
  ElseIf Green% > 255 Then
    Green% = 255
  End If
  If Blue% < 0 Then
    Blue% = 0
  ElseIf Blue% > 255 Then
    Blue% = 255
  End If
  Picture6.Line (0, 0)-(1650, 570), RGB(Red%, Green%, Blue%), BF
  Red% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 2) - Pal!(Cnt% - 1, 2)) + Pal!(Cnt% - 1, 2)) / 255 * 2130
  Green% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 3) - Pal!(Cnt% - 1, 3)) + Pal!(Cnt% - 1, 3)) / 255 * 2130
  Blue% = ((X - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) / (Int((Pal!(Cnt%, 1) - 1) / 254 * 6210) - Int((Pal!(Cnt% - 1, 1) - 1) / 254 * 6210)) * (Pal!(Cnt%, 4) - Pal!(Cnt% - 1, 4)) + Pal!(Cnt% - 1, 4)) / 255 * 2130
  Picture3.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture4.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture5.Line (0, 0)-(450, 2130), RGB(255, 255, 255), BF
  Picture3.Line (0, 2130 - Red%)-(450, 2130), RGB(255, 0, 0), BF
  Picture4.Line (0, 2130 - Green%)-(450, 2130), RGB(0, 255, 0), BF
  Picture5.Line (0, 2130 - Blue%)-(450, 2130), RGB(0, 0, 255), BF
  DataForm.Refresh

  End If
End Sub

Private Sub Text1_Change()
  If (DataForm.Visible = 0) Or (Stp$ = "Y") Then
    Stp$ = "N"
  Else
  
  MinFluxI = Val(DataForm.Text1.Text)
  DataForm.Text1.Text = Str$(MinFluxI)
  If DataForm.CalSlope.Caption = "" Then
    If MinFluxI < MaxFluxI Then
      DataForm.Command1.Enabled = -1
    Else
      DataForm.Command1.Enabled = 0
    End If
    Stp$ = "Y"
    If (MinFluxI = MinFluxPI) And (MaxFluxI = MaxFluxPI) Then
      DataForm.Check1.Value = 1
    Else
      DataForm.Check1.Value = 0
    End If
    Stp$ = "N"
  Else
    Length% = Len(DataForm.CalSlope.Caption)
    MinFluxI = MinFluxI / Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    If MinFluxI < MaxFluxI Then
      DataForm.Command1.Enabled = -1
    Else
      DataForm.Command1.Enabled = 0
    End If
    Stp$ = "Y"
    If (MinFluxI = MinFluxPI) And (MaxFluxI = MaxFluxPI) Then
      DataForm.Check1.Value = 1
    Else
      DataForm.Check1.Value = 0
    End If
    Stp$ = "N"
  End If
  DataForm.Refresh

  End If
End Sub

Private Sub Text2_Change()
  If (DataForm.Visible = 0) Or (Stp$ = "Y") Then
    Stp$ = "N"
  Else
  
  MaxFluxI = Val(DataForm.Text2.Text)
  DataForm.Text2.Text = Str$(MaxFluxI)
  If DataForm.CalSlope.Caption = "" Then
    If MinFluxI < MaxFluxI Then
      DataForm.Command1.Enabled = -1
    Else
      DataForm.Command1.Enabled = 0
    End If
    Stp$ = "Y"
    If (MinFluxI = MinFluxPI) And (MaxFluxI = MaxFluxPI) Then
      DataForm.Check1.Value = 1
    Else
      DataForm.Check1.Value = 0
    End If
    Stp$ = "N"
  Else
    Length% = Len(DataForm.CalSlope.Caption)
    MaxFluxI = MaxFluxI / Val(Mid$(DataForm.CalSlope.Caption, 8, Length% - 10))
    If MinFluxI < MaxFluxI Then
      DataForm.Command1.Enabled = -1
    Else
      DataForm.Command1.Enabled = 0
    End If
    Stp$ = "Y"
    If (MinFluxI = MinFluxPI) And (MaxFluxI = MaxFluxPI) Then
      DataForm.Check1.Value = 1
    Else
      DataForm.Check1.Value = 0
    End If
    Stp$ = "N"
  End If
  DataForm.Refresh

  End If
End Sub

