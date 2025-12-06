# Page snapshot

```yaml
- generic [ref=e1]:
  - region "Notifications alt+T"
  - generic [ref=e2]:
    - heading "Gerenciador de Whatsapp" [level=1] [ref=e9]
    - generic [ref=e11]:
      - heading "Bem-vindo" [level=2] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e16]:
          - generic [ref=e17]: Email
          - generic [ref=e18]:
            - img [ref=e19]
            - textbox "seu@email.com" [ref=e22]: maria.clara@exemplo.com.br
        - generic [ref=e24]:
          - generic [ref=e25]: Senha
          - generic [ref=e26]:
            - img [ref=e27]
            - textbox "••••••••" [ref=e30]: "123456"
        - button "Entrando..." [active] [ref=e31] [cursor=pointer]:
          - generic [ref=e32]: Entrando...
      - paragraph [ref=e34]:
        - text: Não tem uma conta?
        - link "Cadastre-se" [ref=e35] [cursor=pointer]:
          - /url: /register
  - alert [ref=e36]
```