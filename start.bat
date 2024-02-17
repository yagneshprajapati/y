# Continuous loop for real-time collaboration
while ($true) {
    Clear-Host

    # Check if Git is installed
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "Git is not installed. Please install Git and try again." -ForegroundColor Red
        break
    }

    # Check for Git configuration
    $gitConfig = git config user.name
    if (-not $gitConfig) {
        # User is not authenticated, ask for credentials
        $githubUsername = Read-Host "Enter your GitHub username"
        $githubPassword = Read-Host -AsSecureString "Enter your GitHub password"

        # Set Git credentials
        git config --global user.name "$githubUsername"
        git config --global credential.helper store
        git credential reject < $null
        git credential approve < <(echo -e "protocol=https\nhost=github.com\nusername=$githubUsername\npassword=$(ConvertFrom-SecureString $githubPassword)")
    }

    Write-Host "Checking for updates..." -ForegroundColor Cyan

    # Perform Git pull
    $pullResult = git pull origin main

    # Handle pull errors
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error pulling from GitHub. Please resolve conflicts manually." -ForegroundColor Red
        break
    }

    # Run your build or start your development server here if needed

    # Check for changes in the local repository
    $changes = git status -s | Where-Object { $_ -notmatch '^ I_.*' }
    if ($changes) {
        Write-Host "Changes detected:" -ForegroundColor Yellow
        Write-Host $changes -ForegroundColor Yellow

        # Commit and push changes
        git add -A
        git commit -m "Automatic commit"
        $pushResult = git push origin main

        # Handle push errors
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error pushing to GitHub. Please resolve conflicts manually." -ForegroundColor Red
            break
        }

        Write-Host "Changes committed and pushed." -ForegroundColor Green
    }

    # Wait for a few seconds before checking again
    Start-Sleep -Seconds 10
}
