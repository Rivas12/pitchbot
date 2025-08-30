@echo off
echo Iniciando servidor Flask PitchBot...

:: Verifica se o ambiente virtual existe, se não, cria
if not exist venv (
    echo Criando ambiente virtual...
    python -m venv venv
)

:: Ativa o ambiente virtual
call venv\Scripts\activate

:: Instala dependências
echo Instalando dependências...
pip install -r requirements.txt

:: Carrega variáveis de ambiente do arquivo .env
echo Carregando configurações...
for /f "tokens=*" %%a in (.env) do (
    set "%%a"
)

:: Inicia o servidor Flask
echo Iniciando servidor...
flask run --port=5000

pause
