VERSION 5.00
Begin VB.Form LoadData 
   Appearance      =   0  'Flat
   BackColor       =   &H80000005&
   BorderStyle     =   3  'Fixed Dialog
   ClientHeight    =   4020
   ClientLeft      =   1605
   ClientTop       =   1635
   ClientWidth     =   6375
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
   LinkTopic       =   "Form2"
   PaletteMode     =   1  'UseZOrder
   ScaleHeight     =   4020
   ScaleWidth      =   6375
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Enabled         =   0   'False
      Height          =   285
      Left            =   240
      TabIndex        =   10
      Text            =   "Text1"
      Top             =   480
      Visible         =   0   'False
      Width           =   1575
   End
   Begin VB.CommandButton Command2 
      Appearance      =   0  'Flat
      Caption         =   "Cancel"
      Height          =   495
      Left            =   4440
      TabIndex        =   9
      Top             =   720
      Width           =   1815
   End
   Begin VB.CommandButton Command1 
      Appearance      =   0  'Flat
      Caption         =   "OK"
      Default         =   -1  'True
      Height          =   495
      Left            =   4440
      TabIndex        =   8
      Top             =   120
      Width           =   1815
   End
   Begin VB.DriveListBox Drive1 
      Appearance      =   0  'Flat
      Height          =   315
      Left            =   2040
      TabIndex        =   6
      Top             =   3480
      Width           =   2175
   End
   Begin VB.DirListBox Dir1 
      Appearance      =   0  'Flat
      Height          =   2115
      Left            =   2040
      TabIndex        =   5
      Top             =   840
      Width           =   2175
   End
   Begin VB.FileListBox File1 
      Appearance      =   0  'Flat
      Height          =   2955
      Left            =   240
      TabIndex        =   2
      Top             =   840
      Width           =   1575
   End
   Begin VB.Label Label6 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   4440
      TabIndex        =   11
      Top             =   1440
      Visible         =   0   'False
      Width           =   1455
   End
   Begin VB.Label Label5 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "Drives:"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   2040
      TabIndex        =   7
      Top             =   3120
      Width           =   615
   End
   Begin VB.Label Label4 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   2040
      TabIndex        =   4
      Top             =   480
      Width           =   2175
   End
   Begin VB.Label Label3 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "Directories:"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   2040
      TabIndex        =   3
      Top             =   120
      Width           =   975
   End
   Begin VB.Label Label2 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   240
      TabIndex        =   1
      Top             =   480
      Width           =   1575
   End
   Begin VB.Label Label1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      Caption         =   "File Name:"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   240
      TabIndex        =   0
      Top             =   120
      Width           =   975
   End
End
Attribute VB_Name = "LoadData"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim Drive$
Dim Button%
Dim Opt%
Dim Ck$
Dim Ck2$
Dim Num%

Private Sub Command1_Click()
  On Error GoTo DirError
  If LoadData.Dir1.ListIndex <> -1 Then
    LoadData.Dir1.Path = Dir1.List(Dir1.ListIndex)
    Exit Sub
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "New Scan" Or LoadData.Caption = "Open Scan") Then
    If ScanForm.Visible = -1 Then
      Opt% = 1 Or 48
      Button% = MsgBox("Open Scan Will Be Discarded", Opt%, "Status Message")
      If Button% = 1 Then
        Unload ScanForm
        LoadData.Hide
        LoadData.Caption = "show"
      End If
    Else
      Unload ScanForm
      LoadData.Hide
      LoadData.Caption = "show"
    End If
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "Append Scan" Or LoadData.Caption = "Add Source" Or LoadData.Caption = "Select Calibration") Then
    LoadData.Hide
    LoadData.Caption = "show"
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "Append Image") Then
    LoadData.Hide
    LoadData.Caption = "append"
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "Select Second Image") Then
    LoadData.Hide
    LoadData.Caption = "bicolor"
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "Select Third Image") Then
    LoadData.Hide
    LoadData.Caption = "tricolor"
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "Superimpose Image") Then
    LoadData.Hide
    LoadData.Caption = "super"
  ElseIf LoadData.File1.filename <> "" And ((LoadData.Caption = "Select Superimposing Image Calibration") Or (LoadData.Caption = "Select Initial Image Calibration") Or (LoadData.Caption = "Select Appending Image Calibration") Or (LoadData.Caption = "Select Second Image Calibration") Or (LoadData.Caption = "Select Third Image Calibration")) Then
    LoadData.Hide
    LoadData.Caption = "okay"
    MsgBox "test"
  ElseIf LoadData.File1.filename <> "" And LoadData.Caption = "Open Calibration" Then
    If CalForm.Visible = -1 Then
      Opt% = 1 Or 48
      Button% = MsgBox("Open Calibration Will Be Discarded", Opt%, "Status Message")
      If Button% = 1 Then
        Unload CalForm
        LoadData.Hide
        LoadData.Caption = "show"
      End If
    Else
      Unload CalForm
      LoadData.Hide
      LoadData.Caption = "show"
    End If
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "New Survey" Or LoadData.Caption = "Open Survey") Then
    If SurvForm.Visible = -1 Then
      Opt% = 1 Or 48
      If SurvForm.Picture5.Visible = -1 Then
        Button% = MsgBox("Open Image Will Be Discarded", Opt%, "Status Message")
      Else
        Button% = MsgBox("Open Survey Will Be Discarded", Opt%, "Status Message")
      End If
      If Button% = 1 Then
        Close #2
        Unload SurvForm
        LoadData.Hide
        LoadData.Caption = "show"
      End If
    Else
      Unload SurvForm
      LoadData.Hide
      LoadData.Caption = "show"
    End If
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "Open Image") Then
    If SurvForm.Visible = -1 Then
      Opt% = 1 Or 48
      If SurvForm.Picture5.Visible = -1 Then
        Button% = MsgBox("Open Image Will Be Discarded", Opt%, "Status Message")
      Else
        Button% = MsgBox("Open Survey Will Be Discarded", Opt%, "Status Message")
      End If
      If Button% = 1 Then
        Close #2
        Unload SurvForm
        LoadData.Hide
        LoadData.Caption = "show"
      End If
    Else
      Unload SurvForm
      LoadData.Hide
      LoadData.Caption = "show"
    End If
  ElseIf LoadData.File1.filename <> "" And (LoadData.Caption = "Open Palette") Then
    LoadData.Hide
    LoadData.Caption = "show"
  ElseIf LoadData.Caption = "Save Scan As" Or LoadData.Caption = "Save Calibration As" Or LoadData.Caption = "Save Survey As" Or LoadData.Caption = "Save Image As" Or LoadData.Caption = "Save Palette As" Or LoadData.Caption = "Save Bitmap As" Then
    If (LoadData.Caption = "Save Scan As" And LCase$(Right$(Text1.Text, 4)) <> ".scn") Or (LoadData.Caption = "Save Calibration As" And LCase$(Right$(Text1.Text, 4)) <> ".cal") Or (LoadData.Caption = "Save Survey As" And LCase$(Right$(Text1.Text, 4)) <> ".srv") Or (LoadData.Caption = "Save Image As" And LCase$(Right$(Text1.Text, 4)) <> ".img") Or (LoadData.Caption = "Save Palette As" And LCase$(Right$(Text1.Text, 4)) <> ".pal") Or (LoadData.Caption = "Save Bitmap As" And LCase$(Right$(Text1.Text, 4)) <> ".bmp") Then
      MsgBox "Invalid Extension", 48, "Error Message"
      LoadData.Text1.SetFocus
      LoadData.Text1.SelStart = 0
      LoadData.Text1.SelLength = Len(Text1.Text)
    Else
      Ck2$ = "N"
      For Num% = 0 To File1.ListCount - 1
        If Text1.Text = File1.List(Num%) Then
          Ck2$ = "Y"
        End If
      Next
      If Ck2$ = "Y" Then
        Opt% = 4 Or 32
        Button% = MsgBox("File Already Exists.  Replace Existing File?", Opt%, "Status Message")
        If Button% = 6 Then
          Open Text1.Text For Output As #1
          Close #1
          LoadData.Hide
          LoadData.Caption = "save"
        End If
      Else
        Open Text1.Text For Output As #1
        Close #1
        LoadData.Hide
        LoadData.Caption = "save"
        Ck$ = "N"
      End If
    End If
  ElseIf LoadData.Caption = "Reload Sweep Data" Then
    LoadData.Hide
    LoadData.Caption = "renew2"
  End If
Exsub:
  If LoadData.Caption = "Save Scan As" Or LoadData.Caption = "Save Calibration As" Or LoadData.Caption = "Save Survey As" Or LoadData.Caption = "Save Image As" Or LoadData.Caption = "Save Palette As" Then
    LoadData.Text1.SetFocus
    LoadData.Text1.SelStart = 0
    LoadData.Text1.SelLength = Len(Text1.Text)
  End If
Exit Sub
DirError:
  MsgBox Error$, 48, "Error Message"
  Resume Exsub
End Sub

Private Sub Command2_Click()
  Ck$ = "N"
  LoadData.Hide
End Sub

Private Sub Dir1_Change()
  Select Case LoadData.Caption
    Case "Load Scan Data"
      LoadData.Label2.Caption = "*.md1"
  End Select
  LoadData.Label4.Caption = Dir1.Path
  File1.Path = Dir1.Path
  ChDir Dir1.Path
End Sub

Private Sub Dir1_GotFocus()
  If Ck$ <> "Y" And LoadData.Text1.Enabled = -1 And LoadData.Text1.Visible = -1 Then
    LoadData.Text1.SetFocus
    LoadData.Text1.SelStart = 0
    LoadData.Text1.SelLength = Len(Text1.Text)
    Ck$ = "Y"
  End If
End Sub

Private Sub Drive1_Change()
  On Error GoTo DriveError
  Dir1.Path = CurDir$(Drive1.Drive)
  ChDrive Drive1.Drive
  Drive$ = Drive1.Drive
ExitSub:
  Exit Sub
DriveError:
  MsgBox Error$, 48, "Error Message"
  Drive1.Drive = Drive$
  Resume ExitSub
End Sub

Private Sub File1_Click()
  LoadData.Label2.Caption = File1.filename
  If LoadData.Dir1.ListIndex <> -1 Then
    LoadData.Dir1.ListIndex = -1
  End If
End Sub

Private Sub File1_DblClick()
  If LoadData.Caption = "New Scan" Or LoadData.Caption = "Open Scan" Then
    If ScanForm.Visible = -1 Then
      Opt% = 1 Or 48
      Button% = MsgBox("Open Scan Will Be Discarded", Opt%, "Status Message")
      If Button% = 1 Then
        Unload ScanForm
        LoadData.Hide
        LoadData.Caption = "show"
      End If
    Else
      Unload ScanForm
      LoadData.Hide
      LoadData.Caption = "show"
    End If
  ElseIf LoadData.Caption = "Append Scan" Or LoadData.Caption = "Add Source" Or LoadData.Caption = "Select Calibration" Then
    LoadData.Hide
    LoadData.Caption = "show"
  ElseIf LoadData.Caption = "Append Image" Then
    LoadData.Hide
    LoadData.Caption = "append"
  ElseIf LoadData.Caption = "Select Second Image" Then
    LoadData.Hide
    LoadData.Caption = "bicolor"
  ElseIf LoadData.Caption = "Select Third Image" Then
    LoadData.Hide
    LoadData.Caption = "tricolor"
  ElseIf LoadData.Caption = "Superimpose Image" Then
    LoadData.Hide
    LoadData.Caption = "super"
  ElseIf LoadData.Caption = "Select Superimposing Image Calibration" Or LoadData.Caption = "Select Initial Image Calibration" Or LoadData.Caption = "Select Appending Image Calibration" Or LoadData.Caption = "Select Second Image Calibration" Or LoadData.Caption = "Select Third Image Calibration" Then
    LoadData.Hide
    LoadData.Caption = "okay"
  ElseIf LoadData.Caption = "Open Calibration" Then
    If CalForm.Visible = -1 Then
      Opt% = 1 Or 48
      Button% = MsgBox("Open Calibration Will Be Discarded", Opt%, "Status Message")
      If Button% = 1 Then
        Unload CalForm
        LoadData.Hide
        LoadData.Caption = "show"
      End If
    Else
      Unload CalForm
      LoadData.Hide
      LoadData.Caption = "show"
    End If
  ElseIf LoadData.Caption = "New Survey" Or LoadData.Caption = "Open Survey" Then
    If SurvForm.Visible = -1 Then
      Opt% = 1 Or 48
      If SurvForm.Picture5.Visible = -1 Then
        Button% = MsgBox("Open Image Will Be Discarded", Opt%, "Status Message")
      Else
        Button% = MsgBox("Open Survey Will Be Discarded", Opt%, "Status Message")
      End If
      If Button% = 1 Then
        Close #2
        Unload SurvForm
        LoadData.Hide
        LoadData.Caption = "show"
      End If
    Else
      Unload SurvForm
      LoadData.Hide
      LoadData.Caption = "show"
    End If
  ElseIf LoadData.Caption = "Open Image" Then
    If SurvForm.Visible = -1 Then
      Opt% = 1 Or 48
      If SurvForm.Picture5.Visible = -1 Then
        Button% = MsgBox("Open Image Will Be Discarded", Opt%, "Status Message")
      Else
        Button% = MsgBox("Open Survey Will Be Discarded", Opt%, "Status Message")
      End If
      If Button% = 1 Then
        Close #2
        Unload SurvForm
        LoadData.Hide
        LoadData.Caption = "show"
      End If
    Else
      Unload SurvForm
      LoadData.Hide
      LoadData.Caption = "show"
    End If
  ElseIf LoadData.Caption = "Open Palette" Then
    LoadData.Hide
    LoadData.Caption = "show"
  ElseIf LoadData.Caption = "Reload Sweep Data" Then
    LoadData.Hide
    LoadData.Caption = "renew2"
  End If
End Sub

Private Sub Form_Load()
  Drive$ = Drive1.Drive
  Ck$ = "N"
End Sub

