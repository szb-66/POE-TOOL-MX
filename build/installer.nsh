!include "LogicLib.nsh"
!include "WinMessages.nsh"
!include "nsDialogs.nsh"

!ifndef BUILD_UNINSTALLER
  Var applicationUpdateInstallSucceeded
!endif

!macro customInstallMode
  !ifndef BUILD_UNINSTALLER
    ${If} ${isUpdated}
      ${If} $hasPerMachineInstallation == "1"
      ${AndIf} $hasPerUserInstallation == "0"
        StrCpy $isForceMachineInstall "1"
      ${ElseIf} $hasPerUserInstallation == "1"
      ${AndIf} $hasPerMachineInstallation == "0"
        StrCpy $isForceCurrentInstall "1"
      ${EndIf}
    ${EndIf}
  !endif
!macroend

!macro customPageAfterChangeDir
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW ShowApplicationUpdateProgress
  !define MUI_PAGE_CUSTOMFUNCTION_LEAVE LeaveApplicationUpdateProgress

  Function ShowApplicationUpdateProgress
    ${If} ${isUpdated}
      StrCpy $applicationUpdateInstallSucceeded "0"
      GetDlgItem $0 $HWNDPARENT 2
      EnableWindow $0 0
      FindWindow $1 "#32770" "" $HWNDPARENT
      GetDlgItem $2 $1 1006
      SendMessage $2 ${WM_SETTEXT} 0 "STR:正在安装更新：0%"
      ${NSD_CreateTimer} RefreshApplicationUpdateProgress 100
    ${EndIf}
  FunctionEnd

  Function RefreshApplicationUpdateProgress
    FindWindow $3 "#32770" "" $HWNDPARENT
    GetDlgItem $4 $3 1004
    GetDlgItem $5 $3 1006
    SendMessage $4 ${PBM_GETPOS} 0 0 $0
    SendMessage $4 ${PBM_GETRANGE} 0 0 $1
    ${If} $1 > 0
      IntOp $2 $0 * 100
      IntOp $2 $2 / $1
      ${If} $2 >= 100
        StrCpy $2 99
      ${EndIf}
      SendMessage $5 ${WM_SETTEXT} 0 "STR:正在安装更新：$2%"
    ${EndIf}
  FunctionEnd

  Function LeaveApplicationUpdateProgress
    ${If} ${isUpdated}
      ${NSD_KillTimer} RefreshApplicationUpdateProgress
      IfAbort application_update_progress_done
      StrCpy $applicationUpdateInstallSucceeded "1"
      FindWindow $3 "#32770" "" $HWNDPARENT
      GetDlgItem $4 $3 1006
      SendMessage $4 ${WM_SETTEXT} 0 "STR:正在安装更新：100%"
      application_update_progress_done:
    ${EndIf}
  FunctionEnd
!macroend

!macro customFinishPage
  !define MUI_PAGE_CUSTOMFUNCTION_PRE PrepareApplicationFinishPage

  Function StartInstalledApplication
    ${If} ${isUpdated}
      StrCpy $1 "--updated"
    ${Else}
      StrCpy $1 ""
    ${EndIf}
    ${StdUtils.ExecShellAsUser} $0 "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "open" "$1"
  FunctionEnd

  Function PrepareApplicationFinishPage
    ${If} ${isUpdated}
    ${AndIf} $applicationUpdateInstallSucceeded == "1"
      Call StartInstalledApplication
      Abort
    ${EndIf}
  FunctionEnd

  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartInstalledApplication"
  !insertmacro MUI_PAGE_FINISH
!macroend
