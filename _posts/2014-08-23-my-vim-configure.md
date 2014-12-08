---
layout: post
title: "my vim configure"
date: 2014-08-23
category: tools
tags: tools
---

```bash
" ~/.vimrc
" ty vimrc configure
"

"
" syntax highlight
"
syn on

"
" show line number
"
set nu

"
" tab
"
set expandtab
set tabstop=4
set shiftwidth=4
set softtabstop=4

"
" indent
"
set autoindent
set smartindent

"
" search
"
set hlsearch
set incsearch

"
" character encoding
"
set encoding=utf-8

"
" bottom status bar
"
set laststatus=2
set statusline=%F%m%r%h%w\ [FORMAT=%{&ff}]\ [TYPE=%Y]\ [POS=%l,%v][%p%%]\ %{strftime(\"%y/%m/%d\ -\ %H:%M\")}
```
