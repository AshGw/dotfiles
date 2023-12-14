# Boilerplate
export PATH=$HOME/bin:/usr/local/bin:$PATH
export ZSH="$HOME/.oh-my-zsh"
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi
ZSH_THEME="robbyrussell"
HIST_STAMPS="dd/mm/yyyy"
plugins=(git)
source $ZSH/oh-my-zsh.sh
export LANG=en_US.UTF-8

# editors for local and remote sessions
if [[ -n $SSH_CONNECTION ]]; then
   export EDITOR='nvim'
 else
   export EDITOR='code'
fi

autoload -U colors && colors	# Load colors

# Basic auto/tab complete

autoload -U compinit
zstyle ':completion:*' menu select
zmodload zsh/complist
compinit
_comp_options+=(globdots)		# Include hidden files.

# Some shortcuts

alias \
	c="clear" \
	ka="killall" \
	sdn="shutdown -h now" \
	e="$EDITOR" \
	a="apt-get" \
	i="sudo apt-get install" \
	g="git" \
	v="nvim" \
	ts="pnpm ts-node" \
	t="touch" \
	p="python3" \
	reload=". ~/.zshrc" \
	y="rm -rf"\
	b="cd .."  \
	bb="cd ..."   \
	bbb="cd ...."   \
	bbbb="cd ....."  \
	bbbbb="cd ......" \
	#nsearch="nix-env -qaP" \
	#ni="nix-env --install" \
	#nu="nix-env --uninstall" \
	#nsp="nix-shell -p" \
	#ns="nix-shell"


# Colorize commands when possible.
alias \
	ls="ls -hN --color=auto --group-directories-first" \
	grep="grep --color=auto" \
	diff="diff --color=auto" \
	ccat="highlight --out-format=ansi" \
	ip="ip -color=auto"

# Colors n all so run this: curl https://raw.githubusercontent.com/seebi/dircolors-solarized/master/dircolors.ansi-dark --output ~/.dircolors
eval `dircolors ~/.dircolors`

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
export LC_ALL=C.UTF-8
export LC_ALL=C.UTF-8
