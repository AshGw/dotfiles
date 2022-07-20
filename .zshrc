# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

export ZSH="$HOME/.oh-my-zsh"
export PATH="/home/ashgw/.local/bin:$PATH"

ZSH_THEME="robbyrussell"


HIST_STAMPS="dd/mm/yyyy"




plugins=(git docker poetry)

source $ZSH/oh-my-zsh.sh
export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
if [[ -n $SSH_CONNECTION ]]; then
   export EDITOR='vim'
 else
   export EDITOR='code'
fi


# run this: curl https://raw.githubusercontent.com/seebi/dircolors-solarized/master/dircolors.ansi-dark --output ~/.dircolors
eval `dircolors ~/.dircolors`