---
name: login_dp
description: Regras de autenticação Supabase, sincronização de perfis e controle de acesso do sistema Gente & Gestão (DP).
tags: [auth, login, supabase, access-control, profiles]
---

# 🔐 Skill: Login DP (Gente & Gestão)

Este documento descreve as especificações técnicas, regras de negócios e fluxos da camada de autenticação do sistema **Gente & Gestão**. O sistema utiliza **Supabase Auth** de forma nativa e um mecanismo interno de perfis na base de dados para validação e liberação de acessos, seguindo as diretrizes visuais e restrições de segurança do projeto.

---

## 🏗️ Arquitetura de Autenticação

A autenticação é centralizada e gerenciada no nível raiz da aplicação em [App.tsx](file:///c:/Users/SR%20APOIO/OneDrive/Documents/Projetos%20IA/DP/src/App.tsx) através de escuta ativa de eventos de sessão do Supabase (`supabase.auth.onAuthStateChange`).

### 1. Fluxo de Entrada (Login)
- **Credenciais**: Login convencional usando E-mail e Senha via provedor nativo do Supabase (`authService.login`).
- **Autenticação & Perfil**: Após o Supabase validar a conta, o sistema busca o registro correspondente na tabela `profiles`.
- **Validação de Permissão (`allowed`)**: O acesso ao Dashboard é condicionado ao campo `allowed` no perfil do usuário. Se `allowed` for `false`, o login é impedido exibindo a mensagem: `"Acesso ainda não liberado. Aguarde aprovação de um gestor."`.
- **Troca Obrigatória de Senha**: Caso a flag `must_change_password` seja `true`, o usuário é interceptado e forçado a alterar a senha por meio do formulário de redefinição antes de obter acesso ao sistema.

### 2. Sincronização e Auto-Correção (Self-Fix)
Para mitigar falhas de sincronização históricas ou migrações de usuários legados, o sistema possui um fluxo de auto-correção:
- Se o usuário autenticar com sucesso no Supabase Auth, mas o seu perfil na tabela `profiles` não existir, o método `getCurrentProfile` ou `login` irá realizar a **auto-criação (Self-Fix)** do perfil com status padrão `allowed: true` e `role: 'Usuario'`.

---

## 🔑 Gestão de Acessos & Perfis

O banco de dados do Supabase armazena as informações adicionais dos usuários no esquema `profiles` mapeado da seguinte forma:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `UUID` | Chave primária que referencia `auth.users.id` do Supabase. |
| `name` | `text` | Nome completo do usuário. |
| `email` | `text` | E-mail corporativo de acesso. |
| `role` | `text` | Papel no sistema (ex: `'Usuario'`, `'Gestor'`). |
| `allowed` | `boolean` | Flag que autoriza (`true`) ou bloqueia (`false`) a entrada no sistema. |
| `must_change_password` | `boolean` | Indica se o usuário precisa redefinir a senha temporária no próximo login. |
| `area` | `text` | Setor ou área de trabalho do usuário (ex: `'Diretoria'`, `'Comercial'`). |

### 1. Solicitação de Cadastro
- Qualquer colaborador pode solicitar acesso na tela inicial clicando em **Cadastrar**.
- Os novos perfis são registrados com os valores padrão: `allowed: false` e `role: 'Usuario'`.
- O acesso só é liberado após a aprovação de um **Gestor**.

### 2. Liberação de Acesso e Reset de Senha (Painel Administrativo)
- Na tela de configurações ([ConfigurationPage.tsx](file:///c:/Users/SR%20APOIO/OneDrive/Documents/Projetos%20IA/DP/src/pages/ConfigurationPage.tsx)), administradores com papel de **Gestor** gerenciam os usuários.
- **Aprovação**: O gestor altera a flag `allowed` para `true` para liberar o acesso.
- **Reset de Senha**: Não há fluxo de redefinição automatizada por e-mail (para prevenir abusos). O gestor redefine manualmente a senha do usuário na área administrativa e altera `must_change_password` para `true`. Ao logar com a senha provisória, o usuário visualiza o modal obrigatório para cadastrar sua nova senha privada.

---

## ✨ Interface, UX & Regras de Design

A tela de login ([LoginView.tsx](file:///c:/Users/SR%20APOIO/OneDrive/Documents/Projetos%20IA/DP/src/pages/LoginView.tsx)) é projetada com uma estética premium e interativa:
- **Tema Visual**: Fundo escuro com gradiente animado (`slate-900` via `blue-950` para `indigo-950`) combinado com círculos de luz suave desfocados (`blur-[120px]`).
- **Estados Dinâmicos**: Transições suaves de estado controladas com `motion` para alternância entre formulários (Entrar, Cadastrar, Troca de Senha).
- **Indicadores de Carregamento**: Feedback visual animado de spinner no botão principal enquanto a requisição com o Supabase está em andamento.

### 🚫 Regras Críticas de Design (Purple Ban)
- **Purple Ban**: É expressamente proibido o uso de cores roxas/violetas em componentes e alertas na aplicação.
- **Alertas de Erro**: Devem utilizar fundos claros e bordas com a tonalidade `rose-500` (Vermelho/Rosa de erro).
- **Alertas de Aviso**: Devem utilizar tons de `amber-500` ou `orange-500` (Amarelo/Laranja).

---

## 🛠️ Guia do Desenvolvedor

As operações de controle de sessão e manipulação de perfis são expostas pelo objeto `authService` em [supabase-service.ts](file:///c:/Users/SR%20APOIO/OneDrive/Documents/Projetos%20IA/DP/src/lib/supabase-service.ts):

### Métodos Principais

- **`login(email, password)`**: Autentica o usuário no Supabase Auth, recupera e valida o perfil na tabela `profiles`. Faz auto-registro caso o perfil não exista.
- **`register(name, email, password, area)`**: Registra o usuário no Supabase Auth e insere o perfil com a respectiva área, com status inativo por padrão (`allowed: false`).
- **`changePassword(newPassword)`**: Redefine a senha do usuário autenticado no Supabase Auth e desmarca a flag `must_change_password`.
- **`getCurrentProfile(userId?)`**: Obtém o perfil atual do usuário logado baseado no ID da sessão, executando auto-correção caso falte o perfil correspondente.
