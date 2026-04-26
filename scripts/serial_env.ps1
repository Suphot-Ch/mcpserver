function Import-LocalEnv {
    param(
        [string]$Path = (Join-Path $PSScriptRoot ".env")
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    foreach ($line in Get-Content -Path $Path) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $trimmed = $line.Trim()
        if ($trimmed.StartsWith("#")) {
            continue
        }

        if ($trimmed -match '^(.*?)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

function Get-SerialCredentials {
    Import-LocalEnv

    $username = $env:SERIAL_LOGIN_USER
    $password = $env:SERIAL_LOGIN_PASSWORD

    if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($password)) {
        throw "Missing SERIAL_LOGIN_USER or SERIAL_LOGIN_PASSWORD in .env"
    }

    [pscustomobject]@{
        Username = $username
        Password = $password
    }
}

function Test-SerialLoginRequired {
    param(
        [string]$Buffer,
        [string]$Username
    )

    $promptPattern = [regex]::Escape("$Username@")
    return $Buffer -match "login:" -or $Buffer -notmatch $promptPattern
}
