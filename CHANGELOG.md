# Change Log

All notable changes to the "zip2commit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.6] - Próximo lançamento

- Adicionada sanitização de nomes de branches para garantir que o arquivo ZIP seja criado com um nome válido
- Caracteres inválidos em nomes de arquivos (como `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) são substituídos por underscores (`_`)
- Melhorado o processo de obtenção de arquivos para fazer checkout na branch correta antes de compactar os arquivos
- Adicionada funcionalidade para retornar automaticamente à branch original após a compactação

## [0.0.5] - Lançamento atual

- Initial release
