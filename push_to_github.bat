@echo off
echo ========================================================
echo  SkillMatch AI - Automated GitHub Deployment
echo ========================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"

echo Checking remote repository...
git remote -v
echo.

echo Pushing all commits to https://github.com/Jana1721/SkillMatch_AI ...
echo.
echo NOTE: If a GitHub sign-in window appears, click 'Sign in with your browser'.
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS! SkillMatch AI has been pushed to GitHub!
    echo  View repository: https://github.com/Jana1721/SkillMatch_AI
    echo ========================================================
) else (
    echo ========================================================
    echo  Push was not completed.
    echo  To push using a Personal Access Token (PAT), run:
    echo  git push https://^<YOUR_TOKEN^>@github.com/Jana1721/SkillMatch_AI.git main
    echo ========================================================
)

echo.
pause
