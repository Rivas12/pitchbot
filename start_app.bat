@echo off
title PitchBot - Iniciador de Aplicacao
color 0A

echo ===================================
echo PitchBot - Iniciador de Aplicacao
echo ===================================
echo.

:: Verificar se está usando o Windows Terminal
where wt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [NOTA] Usando o Windows Terminal - Os servidores serao abertos em novas abas
) else (
    echo [NOTA] Windows Terminal nao detectado - Os servidores serao abertos em novas janelas
    echo        Para uma melhor experiencia, recomendamos instalar o Windows Terminal
)
echo.

echo Verificando ambiente...

:: Verificar se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo Node.js nao encontrado! Por favor, instale o Node.js para continuar.
    goto :fim
)

:: Verificar se o Python está instalado
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo Python nao encontrado! Por favor, instale o Python para continuar.
    goto :fim
)

echo Ambiente verificado com sucesso!
echo.

:: Menu de opções
:menu
echo Escolha uma opcao:
echo 1. Iniciar apenas o servidor Front-end (Vite)
echo 2. Iniciar apenas o servidor Back-end (Flask)
echo 3. Iniciar ambos os servidores (Padrao - Pressione Enter)
echo 0. Sair
echo.

:: Define a opção padrão como 3 (ambos)
set opcao=3
set /p "opcao=Digite o numero da opcao desejada [3]: "

if "%opcao%"=="1" goto :frontend
if "%opcao%"=="2" goto :backend
if "%opcao%"=="3" goto :ambos
if "%opcao%"=="0" goto :fim
if "%opcao%"=="" goto :ambos

color 0C
echo Opcao invalida. Tente novamente.
timeout /t 2 >nul
color 0A
goto :menu

:frontend
echo.
echo Iniciando servidor Front-end (Vite)...
echo.

:: Verificar se está usando o Windows Terminal e abrir uma nova aba
where wt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    pushd "%~dp0"
    start wt -w 0 nt --title "Frontend" cmd /c "cd %~dp0 && npm run dev"
    popd
) else (
    :: Fallback para o CMD padrão
    start cmd /k "cd %~dp0 && npm run dev"
)

echo Servidor Front-end iniciado! Uma nova aba/janela foi aberta.
echo O servidor estara disponivel em http://localhost:5173
goto :fim

:backend
echo.
echo Iniciando servidor Back-end (Flask)...
echo.

:: Verificar se está usando o Windows Terminal e abrir uma nova aba
where wt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    pushd "%~dp0backend"
    start wt -w 0 nt --title "Backend" cmd /c "cd %~dp0backend && start_server.bat"
    popd
) else (
    :: Fallback para o CMD padrão
    start cmd /k "cd %~dp0backend && start_server.bat"
)

echo Servidor Back-end iniciado! Uma nova aba/janela foi aberta.
echo O servidor estara disponivel em http://localhost:5000
goto :fim

:ambos
echo.
echo Iniciando ambos os servidores...
echo.

:: Verificar se está usando o Windows Terminal e abrir em novas abas
where wt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Abrindo servidores em novas abas do Windows Terminal...
    
    :: Iniciar servidor Front-end
    pushd "%~dp0"
    start wt -w 0 nt --title "Frontend" cmd /c "cd %~dp0 && npm run dev"
    popd
    timeout /t 1 > nul
    
    :: Iniciar servidor Back-end
    pushd "%~dp0backend"
    start wt -w 0 nt --title "Backend" cmd /c "cd %~dp0backend && start_server.bat"
    popd
) else (
    :: Fallback para o CMD padrão
    start cmd /k "cd %~dp0 && npm run dev"
    start cmd /k "cd %~dp0\backend && start_server.bat"
)

echo Servidor Front-end iniciado! Uma nova aba/janela foi aberta.
echo O servidor Front-end estara disponivel em http://localhost:5173
echo.
echo Servidor Back-end iniciado! Uma nova aba/janela foi aberta.
echo O servidor Back-end estara disponivel em http://localhost:5000
goto :fim

:fim
echo.
echo ===================================
echo.
echo Pressione qualquer tecla para sair...
pause >nul
