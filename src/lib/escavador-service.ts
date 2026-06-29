/**
 * Service para integração com a API do Escavador Business (v2)
 * Documentação: https://api.escavador.com/v2/docs/
 */

const ESCAVADOR_API_URL = 'https://api.escavador.com/api/v2';
const API_TOKEN = import.meta.env.VITE_ESCAVADOR_API_TOKEN;

export const escavadorService = {
  /**
   * Retorna os processos de um envolvido a partir do CPF ou CNPJ.
   * @param cpfCnpj CPF ou CNPJ do envolvido. Pode conter formatação.
   */
  async getProcessosByCpfCnpj(cpfCnpj: string) {
    if (!API_TOKEN) {
      console.warn('Token do Escavador não configurado em VITE_ESCAVADOR_API_TOKEN.');
    }

    const cleanedCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');
    const url = new URL(`${ESCAVADOR_API_URL}/envolvido/processos`);
    url.searchParams.append('cpf_cnpj', cleanedCpfCnpj);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (e) {
        // Fallback for non-JSON errors
      }
      throw new Error(`Erro na API do Escavador: ${response.status} - ${errorMsg}`);
    }

    return response.json();
  },

  /**
   * Retorna apenas o resumo (quantidade) de processos de um envolvido.
   * @param cpfCnpj CPF ou CNPJ do envolvido.
   */
  async getResumoProcessosByCpfCnpj(cpfCnpj: string) {
    if (!API_TOKEN) {
      console.warn('Token do Escavador não configurado em VITE_ESCAVADOR_API_TOKEN.');
    }

    const cleanedCpfCnpj = cpfCnpj.replace(/[^\d]/g, '');
    const url = new URL(`${ESCAVADOR_API_URL}/envolvido/resumo`);
    url.searchParams.append('cpf_cnpj', cleanedCpfCnpj);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (e) {
        // Fallback
      }
      throw new Error(`Erro na API do Escavador (Resumo): ${response.status} - ${errorMsg}`);
    }

    return response.json();
  },

  /**
   * Retorna o saldo atual e quantidade de créditos da conta.
   */
  async getSaldo() {
    if (!API_TOKEN) {
      console.warn('Token do Escavador não configurado em VITE_ESCAVADOR_API_TOKEN.');
    }

    const url = new URL(`https://api.escavador.com/api/v1/quantidade-creditos`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar saldo: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Retorna os detalhes de um processo específico a partir do seu Número CNJ.
   * @param numeroCnj O número CNJ do processo (com ou sem formatação)
   */
  async getProcessoByCnj(numeroCnj: string) {
    if (!API_TOKEN) {
      console.warn('Token do Escavador não configurado em VITE_ESCAVADOR_API_TOKEN.');
    }

    // A API do escavador lida com CNJ formatado ou apenas números
    const cleanedCnj = numeroCnj.replace(/[^\d.-]/g, '');
    const url = new URL(`${ESCAVADOR_API_URL}/processos/numero_cnj/${cleanedCnj}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (e) {}
      throw new Error(`Erro ao atualizar processo (Escavador): ${response.status} - ${errorMsg}`);
    }

    return response.json();
  },

  /**
   * Retorna o histórico completo de movimentações de um processo.
   * @param processoId ID do processo no Escavador.
   */
  async getMovimentacoesProcesso(processoId: string | number) {
    if (!API_TOKEN) {
      console.warn('Token do Escavador não configurado em VITE_ESCAVADOR_API_TOKEN.');
    }

    const url = new URL(`${ESCAVADOR_API_URL}/processos/${processoId}/movimentacoes`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (e) {}
      throw new Error(`Erro ao buscar movimentações: ${response.status} - ${errorMsg}`);
    }

    return response.json();
  },

  /**
   * Retorna os documentos públicos associados a um processo.
   * @param processoId ID do processo no Escavador.
   */
  async getDocumentosProcesso(processoId: string | number) {
    if (!API_TOKEN) {
      console.warn('Token do Escavador não configurado em VITE_ESCAVADOR_API_TOKEN.');
    }

    const url = new URL(`${ESCAVADOR_API_URL}/processos/${processoId}/documentos`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (e) {}
      throw new Error(`Erro ao buscar documentos: ${response.status} - ${errorMsg}`);
    }

    return response.json();
  },

  /**
   * Busca processos onde uma pessoa ou empresa esteja envolvida, a partir de seu NOME.
   * @param nome Nome ou Razão Social do envolvido.
   */
  async getProcessosByNome(nome: string) {
    if (!API_TOKEN) {
      console.warn('Token do Escavador não configurado em VITE_ESCAVADOR_API_TOKEN.');
    }

    const url = new URL(`${ESCAVADOR_API_URL}/envolvido/nome`);
    url.searchParams.append('nome', nome);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (e) {}
      throw new Error(`Erro ao buscar por nome: ${response.status} - ${errorMsg}`);
    }

    return response.json();
  },

  /**
   * Solicita uma atualização assíncrona (forçada) no tribunal para o processo.
   * Custa créditos adicionais.
   * @param numeroCnj O número CNJ do processo
   */
  async requestAsyncUpdate(numeroCnj: string) {
    if (!API_TOKEN) {
      console.warn('Token do Escavador não configurado em VITE_ESCAVADOR_API_TOKEN.');
    }

    const cleanedCnj = numeroCnj.replace(/[^\d.-]/g, '');
    const url = new URL(`${ESCAVADOR_API_URL}/async/processos/numero_cnj/${cleanedCnj}`);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (e) {}
      throw new Error(`Erro ao forçar atualização assíncrona: ${response.status} - ${errorMsg}`);
    }

    return response.json();
  }
};
