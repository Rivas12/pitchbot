# 🤖 PitchBot - Criador de Propostas com IA

![PitchBot](https://img.shields.io/badge/PitchBot-v1.0.0-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite)
![Flask](https://img.shields.io/badge/Flask-2.3-000000?style=for-the-badge&logo=flask)

Uma aplicação web moderna e intuitiva para criar propostas comerciais profissionais usando inteligência artificial. Desenvolvida com React, Vite, Flask e um design limpo e responsivo.

## ✨ Funcionalidades

- 🎨 **Interface Moderna**: Design clean e minimalista com cores suaves
- 📱 **Responsivo**: Funciona perfeitamente em desktop e mobile
- 🤖 **IA Integrada**: Geração automática de propostas personalizadas com OpenAI
- 📋 **Gerenciamento**: Liste, edite, copie e delete propostas facilmente
- ⚡ **Performance**: Construído com Vite para carregamento ultrarrápido
- 🎯 **UX Amigável**: Interface intuitiva e fácil de usar
- 🔌 **API Backend**: API Flask para processamento seguro das requisições à OpenAI

## 🚀 Demo

A aplicação inclui:
- **Header**: Logo PitchBot e navegação minimalista
- **Formulário**: Campos para cliente, serviço, valor e prazo
- **Gerador IA**: Botão animado para gerar propostas
- **Lista de Propostas**: Visualização organizada com ações
- **Footer**: Simples e elegante

## 🛠️ Tecnologias

- **Frontend**: React 18+ com Hooks
- **Build Tool**: Vite 5.0+
- **Styling**: CSS3 com variáveis customizadas
- **Backend**: Flask 2.3+ com Python
- **API Integration**: OpenAI API para geração de conteúdo
- **Tipografia**: Google Fonts (Inter)
- **Icons**: Emojis para uma interface amigável

## 📦 Instalação

### Frontend

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/pitchbot.git
   cd pitchbot
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**
   ```
   http://localhost:5173
   ```

### Backend

1. **Navegue até a pasta do backend**
   ```bash
   cd backend
   ```

2. **Execute o script de inicialização (Windows)**
   ```bash
   start_server.bat
   ```

   Ou configure manualmente:

   ```bash
   # Criar ambiente virtual
   python -m venv venv
   
   # Ativar ambiente virtual (Windows)
   venv\Scripts\activate
   # (Linux/Mac)
   # source venv/bin/activate
   
   # Instalar dependências
   pip install -r requirements.txt
   
   # Iniciar servidor
   flask run --port=5000
   ```

3. **Configure sua chave API da OpenAI**
   
   Adicione sua chave API no arquivo `backend/.env`:
   ```
   OPENAI_API_KEY=sua_chave_api_aqui
   ```

## 🎨 Paleta de Cores

- **Azul Primário**: `#3B82F6` - Botões e elementos principais
- **Azul Escuro**: `#2563EB` - Hover states
- **Roxo Secundário**: `#8B5CF6` - Elementos de destaque
- **Laranja Accent**: `#F97316` - CTAs especiais
- **Cinzas**: `#F9FAFB` a `#111827` - Backgrounds e textos

## 📁 Estrutura do Projeto

```
pitchbot/
├── backend/                # API Flask
│   ├── app.py              # Código principal da API 
│   ├── requirements.txt    # Dependências Python
│   ├── .env                # Variáveis de ambiente (não versionado)
│   ├── start_server.bat    # Script de inicialização (Windows)
│   └── README.md           # Documentação da API
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── App.jsx             # Componente principal
│   ├── App.css             # Estilos específicos
│   ├── index.css           # Estilos globais
│   └── main.jsx            # Ponto de entrada
├── index.html              # Template HTML
├── package.json            # Dependências e scripts
├── vite.config.js          # Configuração do Vite
└── README.md               # Este arquivo
```

## 🚀 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza build de produção
- `npm run lint` - Executa o ESLint

## 💡 Como Usar

1. **Inicie o backend Flask** usando o script `start_server.bat` ou manualmente

2. **Inicie o frontend React** com `npm run dev`

3. **Preencha o formulário** com os dados do cliente:
   - Nome do cliente
   - Tipo de serviço
   - Valor do projeto
   - Prazo de entrega

4. **Clique em "Gerar Proposta com IA"** e aguarde alguns segundos

5. **Visualize a proposta gerada** na seção lateral

6. **Gerencie suas propostas** com as ações:
   - ✏️ **Editar**: Modifique a proposta
   - 📋 **Copiar**: Copie para área de transferência
   - 🗑️ **Deletar**: Remove a proposta

## 🔄 Arquitetura

A aplicação usa uma arquitetura cliente-servidor:

1. **Frontend React**: Interface do usuário e gerenciamento de estado
2. **Backend Flask**: Processamento seguro das requisições à API da OpenAI
3. **API OpenAI**: Geração de conteúdo baseado em IA (modo fallback caso o backend esteja indisponível)

## 🎯 Funcionalidades Futuras

- [ ] Templates customizáveis de propostas
- [ ] Exportação em PDF
- [ ] Sistema de usuários e login
- [ ] Histórico e analytics
- [ ] Integração com CRM
- [ ] Banco de dados para armazenamento persistente

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Para contribuir:

1. Faça fork do projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ e ☕

## 📞 Suporte

Se você tiver alguma dúvida ou sugestão, feel free para abrir uma issue!

---

⭐ **Gostou do projeto? Deixe uma estrela!** ⭐
