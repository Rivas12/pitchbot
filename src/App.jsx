import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [proposals, setProposals] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  // Status da API Flask
  const [apiStatus, setApiStatus] = useState({ status: 'checking', message: 'Verificando conexão...' })
  // Usar apenas a chave API do arquivo .env para compatibilidade
  const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
  // Controle de tema (claro/escuro)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('pitchbot-theme')
    return savedTheme === 'dark'
  })
  const [formData, setFormData] = useState({
    clientName: '',
    projectDescription: '',
    additionalPoints: '',
    value: '',
    deadline: '',
    showAdditionalPoints: false
  })
  
  // Estado para controlar quais propostas estão expandidas
  const [expandedProposals, setExpandedProposals] = useState({})
  
  // Verificar status da API e carregar propostas ao iniciar
  useEffect(() => {
    checkApiStatus()
    
    // Carregar propostas do banco de dados quando o componente for montado
    if (apiStatus.status === 'online' || apiStatus.status === 'checking') {
      fetchProposals()
    }
    
    // Verificar o status da API a cada 30 segundos
    const apiStatusInterval = setInterval(() => {
      checkApiStatus()
    }, 30000)
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(apiStatusInterval)
  }, [])
  
  // Atualiza a lista de propostas quando o status da API mudar para online
  useEffect(() => {
    if (apiStatus.status === 'online') {
      fetchProposals()
    }
  }, [apiStatus.status])
  
  // Aplicar o tema quando o estado darkMode mudar
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-theme')
      localStorage.setItem('pitchbot-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark-theme')
      localStorage.setItem('pitchbot-theme', 'light')
    }
  }, [darkMode])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Função para alternar o estado de expansão de uma proposta
  const toggleProposal = (id) => {
    setExpandedProposals(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }
  
  // Função para verificar o status da API Flask
  const checkApiStatus = async () => {
    try {
      setApiStatus({ status: 'checking', message: 'Verificando conexão com a API...' })
      const response = await fetch('http://localhost:5000/api/health')
      const data = await response.json()
      
      if (data.status === 'online') {
        const timestamp = new Date().toLocaleTimeString()
        setApiStatus({ 
          status: 'online', 
          message: `API Flask conectada (verificado às ${timestamp}). Clique para verificar novamente.` 
        })
      } else {
        setApiStatus({ 
          status: 'error', 
          message: 'API Flask indisponível. Verifique se o servidor está rodando corretamente.' 
        })
      }
    } catch (error) {
      setApiStatus({ 
        status: 'offline', 
        message: 'API Flask não está disponível. Verifique se o servidor backend está em execução.' 
      })
    }
  }

  const generateProposal = async () => {
    if (!formData.clientName || !formData.projectDescription || !formData.value || !formData.deadline) {
      toast.error('Por favor, preencha todos os campos obrigatórios!')
      return
    }

    setIsGenerating(true)
    
    try {
      // Verificar se a API está online
      if (apiStatus.status === 'online') {
        // Usar API Flask
        const response = await fetch('http://localhost:5000/api/generate-proposal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientName: formData.clientName,
            projectDescription: formData.projectDescription,
            additionalPoints: formData.additionalPoints,
            value: formData.value,
            deadline: formData.deadline,
          }),
        })
        
        const result = await response.json()
        
        if (result.success && result.proposal) {
          const serverProposal = result.proposal
          
          const newProposal = {
            id: serverProposal.id, // Usar o ID gerado pelo servidor
            clientName: serverProposal.clientName,
            projectDescription: serverProposal.projectDescription,
            additionalPoints: serverProposal.additionalPoints || '',
            value: serverProposal.value,
            deadline: serverProposal.deadline,
            content: serverProposal.content,
            createdAt: new Date(serverProposal.createdAt).toLocaleDateString('pt-BR'),
            generatedWith: serverProposal.generatedWith,
            author: serverProposal.author
          }
          
          setProposals(prev => [newProposal, ...prev])
        } else {
          throw new Error(result.error || 'Erro ao gerar proposta')
        }
      } else {
        // Modo de fallback - usar o método antigo direto no frontend
        const currentApiKey = envApiKey
        
        await new Promise(resolve => setTimeout(resolve, currentApiKey && currentApiKey.startsWith('sk-') ? 3000 : 2000))
        
        const newProposal = {
          id: Date.now(),
          clientName: formData.clientName,
          projectDescription: formData.projectDescription,
          additionalPoints: formData.additionalPoints,
          value: formData.value,
          deadline: formData.deadline,
          content: currentApiKey && currentApiKey.startsWith('sk-') 
            ? `Prezado(a) ${formData.clientName},

É com grande satisfação que apresentamos nossa proposta comercial personalizada para o projeto de ${formData.projectDescription}.

🎯 RESUMO EXECUTIVO:
Nossa equipe especializada desenvolveu uma solução completa e sob medida para atender às suas necessidades específicas, garantindo excelência, pontualidade e resultados superiores.

📋 DETALHES DO PROJETO:
• Escopo: ${formData.projectDescription}
• Prazo de Entrega: ${formData.deadline}
• Investimento Total: R$ ${parseFloat(formData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${formData.additionalPoints ? `✅ DIFERENCIAIS INCLUSOS:
${formData.additionalPoints.split(',').map(point => '• ' + point.trim()).join('\n')}

` : ''}💼 NOSSA METODOLOGIA:
1. Análise detalhada dos requisitos e objetivos
2. Desenvolvimento personalizado com foco em qualidade
3. Testes rigorosos para garantir perfeito funcionamento
4. Entrega dentro do prazo com suporte dedicado

🤝 PRÓXIMOS PASSOS:
Caso esta proposta atenda às suas expectativas, podemos agendar uma reunião para discutir os detalhes e iniciar o projeto o quanto antes.

Atenciosamente,
Equipe PitchBot

---
Proposta gerada com IA GPT ✨`
            : `Prezado(a) ${formData.clientName},

É com grande satisfação que apresentamos nossa proposta para o projeto de ${formData.projectDescription}.

DETALHES DO PROJETO:
• Projeto: ${formData.projectDescription}
• Valor do Investimento: R$ ${parseFloat(formData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Prazo de Entrega: ${formData.deadline}
${formData.additionalPoints ? `\nPONTOS ADICIONAIS:\n${formData.additionalPoints}` : ''}

NOSSA PROPOSTA:
Desenvolvemos soluções personalizadas que atendem às suas necessidades específicas, seguindo as melhores práticas do mercado e garantindo qualidade excepcional.

Atenciosamente,
Equipe PitchBot

---
Proposta gerada em modo simulação 🎭`,
          createdAt: new Date().toLocaleDateString('pt-BR'),
          generatedWith: currentApiKey && currentApiKey.startsWith('sk-') ? 'gpt' : 'simulation'
        }
        
        setProposals(prev => [newProposal, ...prev])
      }
      
    } catch (error) {
      console.error('Erro ao gerar proposta:', error)
      toast.error('Ocorreu um erro ao gerar a proposta. Por favor, tente novamente.')
    } finally {
      // Limpar formulário e finalizar estado de carregamento
      setFormData({ 
        clientName: '', 
        projectDescription: '', 
        additionalPoints: '', 
        value: '', 
        deadline: '',
        showAdditionalPoints: false  // Reset to collapsed state after submission
      })
      setIsGenerating(false)
    }
  }

  const deleteProposal = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta proposta?')) {
      try {
        // Tentar excluir do banco de dados se a API estiver online
        if (apiStatus.status === 'online') {
          const response = await fetch(`http://localhost:5000/api/proposals/${id}`, {
            method: 'DELETE'
          })
          
          const result = await response.json()
          
          if (result.success) {
            // Remover da lista local apenas se for excluído com sucesso do servidor
            setProposals(prev => prev.filter(p => p.id !== id))
            toast.info('Proposta deletada com sucesso')
          } else {
            toast.error(`Erro ao deletar: ${result.error || 'Erro desconhecido'}`)
          }
        } else {
          // Se a API estiver offline, apenas remover da lista local
          setProposals(prev => prev.filter(p => p.id !== id))
          toast.info('Proposta removida da lista local')
        }
      } catch (error) {
        console.error('Erro ao deletar proposta:', error)
        toast.error('Erro ao comunicar com o servidor. Tente novamente.')
      }
    }
  }

  const copyProposal = (content) => {
    navigator.clipboard.writeText(content)
    toast.success('Proposta copiada para a área de transferência!')
  }
  
  // Função para alternar o tema claro/escuro
  const toggleTheme = (e) => {
    if (e) {
      // Criar efeito de transição a partir do ponto do clique
      const appElement = document.querySelector('.app');
      const x = e.clientX;
      const y = e.clientY;
      
      // Definir o ponto de origem do efeito radial
      appElement.style.setProperty('--x', `${x}px`);
      appElement.style.setProperty('--y', `${y}px`);
      
      // Adicionar classe para a animação
      appElement.classList.add('theme-transition');
      
      // Remover a classe após a animação
      setTimeout(() => {
        appElement.classList.remove('theme-transition');
      }, 500);
    }
    
    // Alternar o estado do tema
    setDarkMode(prev => !prev);
    
    // Toaster de feedback
    toast.info(`Tema ${!darkMode ? 'escuro' : 'claro'} ativado`, {
      position: "bottom-right",
      autoClose: 1500,
      hideProgressBar: true,
    });
  }

  // Função para buscar todas as propostas do banco de dados
  const fetchProposals = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/proposals')
      const data = await response.json()
      
      if (data.success && Array.isArray(data.proposals)) {
        // Formatar as propostas recebidas para o formato esperado pelo frontend
        const formattedProposals = data.proposals.map(p => ({
          id: p.id,
          clientName: p.client_name,
          projectDescription: p.project_description,
          value: p.value,
          deadline: p.deadline,
          additionalPoints: p.additional_points || '',
          content: p.content,
          createdAt: new Date(p.created_at).toLocaleDateString('pt-BR'),
          generatedWith: p.model.includes('gpt') ? 'gpt' : 'simulation',
          author: p.author
        }))
        
        setProposals(formattedProposals)
      } else {
        console.error('Erro ao buscar propostas:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar propostas:', error)
      toast.error('Não foi possível carregar as propostas do servidor.')
    }
  }
  
  // Função para buscar propostas com filtro de pesquisa
  const searchProposals = async (searchTerm) => {
    if (!apiStatus.status === 'online') {
      toast.warning('API offline. Não é possível pesquisar propostas.')
      return
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/proposals?search=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      
      if (data.success && Array.isArray(data.proposals)) {
        const formattedProposals = data.proposals.map(p => ({
          id: p.id,
          clientName: p.client_name,
          projectDescription: p.project_description,
          value: p.value,
          deadline: p.deadline,
          additionalPoints: p.additional_points || '',
          content: p.content,
          createdAt: new Date(p.created_at).toLocaleDateString('pt-BR'),
          generatedWith: p.model.includes('gpt') ? 'gpt' : 'simulation',
          author: p.author
        }))
        
        setProposals(formattedProposals)
      }
    } catch (error) {
      console.error('Erro na pesquisa de propostas:', error)
      toast.error('Erro ao pesquisar propostas.')
    }
  }

  // Funções de gerenciamento de chave API removidas, 
  // já que usamos apenas a chave do arquivo .env

  return (
    <div className="app">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">PB</div>
              PitchBot
              <div 
                className={`api-status-indicator ${apiStatus.status}`} 
                title={apiStatus.message}
                onClick={checkApiStatus}
              >
                <div className="pulse-dot"></div>
              </div>
            </div>
            <nav className="nav">
              <a href="#" className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                Home
              </a>
              <a href="#" className={`nav-link ${activeTab === 'proposals' ? 'active' : ''}`} onClick={() => setActiveTab('proposals')}>
                Propostas
              </a>
              <a href="#" className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                Configurações
              </a>
              <button 
                className="theme-button" 
                onClick={toggleTheme} 
                title={darkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {activeTab === 'home' && (
            <div className="main-content">
              <div className="form-section">
                <h1 className="section-title">Criar Nova Proposta</h1>
                <p className="section-subtitle">
                  Preencha os dados abaixo e nossa IA criará uma proposta profissional para você.
                </p>
                
                <div className="card form-card">
                  <div className="card-header">
                    <h3>Dados da Proposta</h3>
                    <p>Informe os detalhes do projeto</p>
                  </div>
                  <div className="card-body">
                    <form onSubmit={(e) => { e.preventDefault(); generateProposal(); }}>
                      <div className="form-grid" style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
                        {/* Informações básicas */}
                        <div className="form-grid-3-cols">
                          <div className="form-group">
                            <label htmlFor="clientName" className="form-label">Nome do Cliente</label>
                            <input
                              type="text" id="clientName" name="clientName" value={formData.clientName}
                              onChange={handleInputChange} className="form-input" placeholder="Ex: João Silva" required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="value" className="form-label">Valor (R$)</label>
                            <input
                              type="number" id="value" name="value" value={formData.value}
                              onChange={handleInputChange} className="form-input" placeholder="5000" min="0" step="0.01" required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="deadline" className="form-label">Prazo de Entrega</label>
                            <input
                              type="text" id="deadline" name="deadline" value={formData.deadline}
                              onChange={handleInputChange} className="form-input" placeholder="Ex: 30 dias" required
                            />
                          </div>
                        </div>
                        
                        {/* Descrição do projeto - campo maior */}
                        <div className="form-group">
                          <label htmlFor="projectDescription" className="form-label">Descrição do Projeto</label>
                          <textarea
                            id="projectDescription" name="projectDescription" value={formData.projectDescription}
                            onChange={handleInputChange} className="form-input" 
                            placeholder="Descreva o projeto em detalhes. Ex: Desenvolvimento de website institucional com 5 páginas, área de blog e formulário de contato."
                            style={{minHeight: "120px", resize: "vertical"}} required
                          />
                        </div>
                        
                        {/* Pontos adicionais - campo maior (colapsável) */}
                        <div className="form-group">
                          <div 
                            onClick={() => setFormData(prev => ({...prev, showAdditionalPoints: !prev.showAdditionalPoints}))} 
                            style={{
                              display: "flex",
                              alignItems: "center", 
                              cursor: "pointer",
                              marginBottom: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "4px",
                              background: "linear-gradient(to right, rgba(var(--primary-blue-rgb), 0.05), transparent)",
                              transition: "all 0.3s ease"
                            }}
                          >
                            <label htmlFor="additionalPoints" className="form-label" style={{
                              margin: 0, 
                              cursor: "pointer",
                              fontWeight: "600",
                              color: "var(--primary-blue)"
                            }}>
                              Pontos Adicionais <span style={{fontSize: "0.8em", fontWeight: "normal"}}>(opcional)</span>
                            </label>
                            <div style={{
                              marginLeft: "auto",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              background: "var(--primary-blue)",
                              color: "white",
                              transform: formData.showAdditionalPoints ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.4s ease"
                            }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                              </svg>
                            </div>
                          </div>
                          
                          <div style={{
                            maxHeight: formData.showAdditionalPoints ? "500px" : "0",
                            overflow: "hidden",
                            transition: "max-height 0.5s ease-in-out, opacity 0.4s ease-in-out, transform 0.4s ease-in-out",
                            opacity: formData.showAdditionalPoints ? 1 : 0,
                            transform: formData.showAdditionalPoints ? "translateY(0)" : "translateY(-10px)"
                          }}>
                            <textarea
                              id="additionalPoints" name="additionalPoints" value={formData.additionalPoints}
                              onChange={handleInputChange} className="form-input" 
                              placeholder="Liste os diferenciais e benefícios inclusos na proposta. Ex: Design responsivo, Otimização SEO, 3 meses de suporte gratuito, Treinamento da equipe"
                              style={{
                                minHeight: "150px", 
                                resize: "vertical",
                                border: "1px solid var(--primary-blue)",
                                boxShadow: "0 2px 8px rgba(var(--primary-blue-rgb), 0.15)"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="submit" disabled={isGenerating}
                        className={`btn btn-primary generate-btn ${isGenerating ? 'loading-btn' : ''}`}
                      >
                        {isGenerating ? 'Gerando Proposta...' : '🤖 Gerar Proposta com IA'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="proposals-section">
                <h2 className="section-title">
                  Proposta Recente 
                </h2>
                
                <div className="proposals-grid">
                  {proposals.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3>Nenhuma proposta criada ainda</h3>
                      <p>Crie sua primeira proposta usando o formulário ao lado</p>
                    </div>
                  ) : (
                    // Mostrar apenas a proposta mais recente (primeiro item do array)
                    <div key={proposals[0].id} className="card proposal-card">
                      <div className="card-body">
                        <div className="proposal-header">
                          <div className="proposal-info">
                            <h4>{proposals[0].clientName}</h4>
                            <div className="proposal-meta">
                              <span title={proposals[0].projectDescription}>📝 {proposals[0].projectDescription.length > 30 ? proposals[0].projectDescription.substring(0, 30) + '...' : proposals[0].projectDescription}</span>
                              <span>💰 R$ {parseFloat(proposals[0].value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span>⏰ {proposals[0].deadline}</span>
                              <span>📅 {proposals[0].createdAt}</span>
                              {proposals[0].generatedWith === 'gpt' && <span>🤖 GPT</span>}
                              {proposals[0].generatedWith === 'simulation' && <span>🎭 Simulação</span>}
                            </div>
                          </div>
                          <div className="proposal-actions">
                            <button className="action-btn edit" title="Editar" onClick={() => toast.info('Função de edição em desenvolvimento')}>✏️</button>
                            <button className="action-btn copy" title="Copiar" onClick={() => copyProposal(proposals[0].content)}>📋</button>
                            <button className="action-btn delete" title="Deletar" onClick={() => deleteProposal(proposals[0].id)}>🗑️</button>
                          </div>
                        </div>
                        
                        <div className="proposal-content-header" style={{
                          display: "flex",
                          alignItems: "center",
                          marginTop: "0.75rem",
                          padding: "0.5rem",
                          borderRadius: "4px",
                          background: "linear-gradient(to right, rgba(var(--primary-blue-rgb), 0.05), transparent)"
                        }}>
                          <div style={{
                            fontWeight: "600",
                            color: "var(--primary-blue)"
                          }}>
                            Conteúdo da Proposta
                          </div>
                          <div style={{
                            marginLeft: "auto",
                            fontSize: "0.8rem",
                            color: "var(--gray-500)"
                          }}>
                            <a href="#" onClick={(e) => {
                              e.preventDefault();
                              setActiveTab('proposals');
                            }} style={{ color: "var(--primary-blue)" }}>Ver todas as propostas →</a>
                          </div>
                        </div>
                        
                        <div className="proposal-content" style={{ 
                          whiteSpace: "pre-wrap", 
                          padding: "1rem 0.5rem", 
                          border: "1px solid var(--gray-100)",
                          borderRadius: "4px",
                          marginTop: "0.5rem",
                          backgroundColor: "var(--gray-50)",
                          maxHeight: "400px",
                          overflowY: "auto"
                        }}>
                          {proposals[0].content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'proposals' && (
            <div className="proposals-management-section">
              <h1 className="section-title">📋 Gerenciamento de Propostas</h1>
              <p className="section-subtitle">Visualize, pesquise e gerencie todas as suas propostas salvas</p>
              
              <div className="card search-card">
                <div className="card-header">
                  <h3>Pesquisar Propostas</h3>
                  <p>Busque por cliente, descrição ou conteúdo</p>
                </div>
                <div className="card-body">
                  <div className="search-form" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Digite termos para pesquisar..."
                      id="searchTerm"
                      style={{ flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          searchProposals(e.target.value);
                        }
                      }}
                    />
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        const searchTerm = document.getElementById('searchTerm').value;
                        searchProposals(searchTerm);
                      }}
                      style={{ minWidth: '120px' }}
                    >
                      🔍 Buscar
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        document.getElementById('searchTerm').value = '';
                        fetchProposals();
                      }}
                      style={{ minWidth: '120px' }}
                    >
                      � Limpar
                    </button>
                  </div>
                  
                  <div className="proposal-stats" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
                    <div>
                      <strong>Total de propostas:</strong> {proposals.length}
                    </div>
                    <button 
                      className="btn btn-sm" 
                      onClick={fetchProposals}
                      style={{
                        backgroundColor: 'var(--gray-200)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      🔄 Atualizar lista
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="proposals-grid">
                {proposals.length === 0 ? (
                  <div className="empty-state" style={{ margin: '2rem 0' }}>
                    <div className="empty-state-icon">📋</div>
                    <h3>Nenhuma proposta encontrada</h3>
                    <p>Crie sua primeira proposta na aba Home ou limpe os filtros de pesquisa</p>
                  </div>
                ) : (
                  proposals.map((proposal) => (
                    <div key={proposal.id} className="card proposal-card">
                      <div className="card-body">
                        <div className="proposal-header">
                          <div className="proposal-info">
                            <h4>{proposal.clientName}</h4>
                            <div className="proposal-meta">
                              <span title={proposal.projectDescription}>📝 {proposal.projectDescription.length > 30 ? proposal.projectDescription.substring(0, 30) + '...' : proposal.projectDescription}</span>
                              <span>💰 R$ {parseFloat(proposal.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span>⏰ {proposal.deadline}</span>
                              <span>📅 {proposal.createdAt}</span>
                              {proposal.generatedWith === 'gpt' && <span>🤖 GPT</span>}
                              {proposal.generatedWith === 'simulation' && <span>🎭 Simulação</span>}
                            </div>
                          </div>
                          <div className="proposal-actions">
                            <button className="action-btn edit" title="Editar" onClick={() => toast.info('Função de edição em desenvolvimento')}>✏️</button>
                            <button className="action-btn copy" title="Copiar" onClick={() => copyProposal(proposal.content)}>📋</button>
                            <button className="action-btn delete" title="Deletar" onClick={() => deleteProposal(proposal.id)}>🗑️</button>
                          </div>
                        </div>
                        
                        <div 
                          onClick={() => toggleProposal(proposal.id)} 
                          style={{
                            display: "flex",
                            alignItems: "center", 
                            cursor: "pointer",
                            marginTop: "0.75rem",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            background: "linear-gradient(to right, rgba(var(--primary-blue-rgb), 0.05), transparent)",
                            transition: "all 0.3s ease"
                          }}
                        >
                          <div style={{
                            fontWeight: "600",
                            color: "var(--primary-blue)"
                          }}>
                            Conteúdo da Proposta
                          </div>
                          <div style={{
                            marginLeft: "auto",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            background: "var(--primary-blue)",
                            color: "white",
                            transform: expandedProposals[proposal.id] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.4s ease"
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                            </svg>
                          </div>
                        </div>
                        
                        <div style={{
                          maxHeight: expandedProposals[proposal.id] ? "2000px" : "0",
                          overflow: "hidden",
                          transition: "max-height 0.5s ease-in-out, opacity 0.4s ease-in-out, transform 0.4s ease-in-out",
                          opacity: expandedProposals[proposal.id] ? 1 : 0,
                          transform: expandedProposals[proposal.id] ? "translateY(0)" : "translateY(-10px)"
                        }}>
                          <div className="proposal-content" style={{ whiteSpace: "pre-wrap", padding: "1rem 0.5rem" }}>
                            {proposal.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h1 className="section-title">⚙️ Configurações</h1>
              <p className="section-subtitle">Configure suas preferências e integrações da aplicação.</p>

              <div className="grid grid-cols-1" style={{ maxWidth: '600px' }}>
                <div className="card">
                  <div className="card-header">
                    <h3>🎨 Aparência</h3>
                    <p>Customize a aparência do aplicativo</p>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">Tema da Aplicação</label>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '1rem',
                        backgroundColor: 'var(--gray-50)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--gray-200)'
                      }}>
                        <div>
                          <strong>{darkMode ? 'Tema Escuro' : 'Tema Claro'}</strong>
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--gray-600)', 
                            margin: '0.25rem 0 0 0' 
                          }}>
                            {darkMode 
                              ? 'Interface escura para conforto visual em ambientes com pouca luz' 
                              : 'Interface clara com fundo branco (padrão)'}
                          </p>
                        </div>
                        <div 
                          onClick={toggleTheme}
                          className={`theme-toggle ${darkMode ? 'dark' : ''}`}
                          role="switch"
                          aria-checked={darkMode}
                          tabIndex="0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              toggleTheme();
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="theme-toggle-thumb">
                            {darkMode ? '🌙' : '☀️'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <h3>🤖 Integração OpenAI</h3>
                    <p>Configure sua chave API para usar o GPT na geração de propostas</p>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">Status da Chave API OpenAI</label>
                      <div style={{ fontSize: '0.875rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                        {envApiKey ? (
                          <span style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
                            ✅ Chave API configurada no arquivo .env
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-orange)', fontWeight: 'bold' }}>
                            ⚠️ Nenhuma chave API configurada no arquivo .env.
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Status da API Flask</label>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        padding: '1rem', 
                        backgroundColor: 'var(--gray-50)', 
                        borderRadius: 'var(--radius)', 
                        border: '1px solid var(--gray-200)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ 
                          color: apiStatus.status === 'online' ? 'var(--primary-blue)' : 
                                 apiStatus.status === 'checking' ? 'var(--gray-600)' : 
                                 'var(--accent-orange)', 
                          fontWeight: 'bold' 
                        }}>
                          {apiStatus.status === 'online' ? '✅ ' : 
                           apiStatus.status === 'checking' ? '⏳ ' : 
                           '⚠️ '}
                          {apiStatus.message}
                        </span>
                        <button 
                          onClick={checkApiStatus}
                          className="btn btn-sm"
                          style={{
                            backgroundColor: 'var(--gray-200)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Verificar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>ℹ️ Informações</h3>
                    <p>Como obter e configurar sua chave API</p>
                  </div>
                  <div className="card-body">
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--gray-800)' }}>
                        Como obter sua chave API:
                      </h4>
                      <ol style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)' }}>
                        <li>Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a></li>
                        <li>Faça login ou crie uma conta</li>
                        <li>Clique em "Create new secret key"</li>
                        <li>Copie a chave e cole aqui</li>
                      </ol>
                      
                      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                        <strong style={{ color: 'var(--accent-orange)' }}>⚠️ Importante:</strong><br />
                        Este aplicativo usa exclusivamente a chave API configurada no arquivo .env do projeto para maior segurança.
                        Para configurar sua chave, adicione-a ao arquivo .env como VITE_OPENAI_API_KEY=sua_chave_aqui
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>📊 Status</h3>
                    <p>Informações sobre o sistema</p>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2" style={{ gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <strong>Propostas criadas:</strong><br />
                        <span style={{ color: 'var(--primary-blue)', fontSize: '1.5rem', fontWeight: '600' }}>
                          {proposals.length}
                        </span>
                        {apiStatus.status === 'online' && (
                          <button
                            onClick={fetchProposals}
                            style={{
                              marginLeft: '0.5rem',
                              padding: '0.25rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                            title="Atualizar contagem"
                          >
                            🔄
                          </button>
                        )}
                      </div>
                      <div>
                        <strong>Modo IA:</strong><br />
                        <span style={{ color: envApiKey ? 'var(--primary-blue)' : 'var(--accent-orange)', fontWeight: '600' }}>
                          {envApiKey ? '🤖 GPT Ativo' : '🎭 Simulação'}
                        </span>
                      </div>
                      <div>
                        <strong>Versão:</strong><br />
                        <span style={{ color: 'var(--gray-600)' }}>v1.0.0</span>
                      </div>
                      <div>
                        <strong>Última atualização:</strong><br />
                        <span style={{ color: 'var(--gray-600)' }}>30/08/2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2025 PitchBot. Todos os direitos reservados. Criado com ❤️ e IA.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App