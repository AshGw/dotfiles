
# nix-env -iA nixpkgs.glibcLocales
export LOCALE_ARCHIVE="$(nix-env --installed --no-name --out-path --query glibc-locales)/lib/locale/locale-archive"

export PATH=$HOME/bin:/usr/local/bin:$PATH
export ZSH="$HOME/.oh-my-zsh"

export LANG=en_US.UTF-8
export LANGUAGE=en_US:en
export LC_ALL=en_US.UTF-8

if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi

# Nix initialization
if [ -e "$HOME/.nix-profile/etc/profile.d/nix.sh" ]; then
    . "$HOME/.nix-profile/etc/profile.d/nix.sh"
fi

ZSH_THEME="bira"
HIST_STAMPS="dd/mm/yyyy"
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
source $ZSH/oh-my-zsh.sh
export LANG=en_US.UTF-8

# editors for local and remote sessions
if [[ -n $SSH_CONNECTION ]]; then
   export EDITOR='nvim'
 else
   export EDITOR='code'
fi

# Disable GPG GUI prompts inside SSH.
if [[ -n "$SSH_CONNECTION" ]]; then
  export PINENTRY_USER_DATA='USE_CURSES=1'
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
	tt="tmux" \
	obs="obsidian" \
	p="python3 -m" \
	reload=". ~/.zshrc" \
	y="rm -rf"\
	f="fzf" \
	lpg="loadpg" \
	tf="terraform" \
	b="cd .."  \
	bb="cd ..."   \
	bbb="cd ...."   \
	bbbb="cd ....."  \
	bbbbb="cd ......" \
  bat="\bat --theme=GitHub" \
  sudo='sudo ' \
  j="just"\
	x="chmod +x" \
	ez="eza --long --header --inode --git" \
	ddgo="librewolf https://duckduckgo.com" \
	gh="librewolf https://github.com/ashgw" \
	d_stopall="docker stop $(docker ps -a -q)" \
	d_restratall="docker restart $(docker ps -a -q)" \
	d_startall="docker start $(docker ps -a -q)" \
	d_rmall="docker rm $(docker ps -a -q)" \
	pubip='dig +short myip.opendns.com @resolver1.opendns.com' \
  	localip='ipconfig getifaddr en1' \
	ips="ifconfig -a | grep -o 'inet6\? \(addr:\)\?\s\?\(\(\([0-9]\+\.\)\{3\}[0-9]\+\)\|[a-fA-F0-9:]\+\)' | awk '{ sub(/inet6? (addr:)? ?/, \"\"); print }'" \
	ports='lsof +c0 -iTCP -sTCP:LISTEN -n -P' \
  defaultip="ip route | grep default"
plugins=(
		zsh-syntax-highlighting
		git
		zsh-autosuggestions
	)

# Colors n all so run this: curl https://raw.githubusercontent.com/seebi/dircolors-solarized/master/dircolors.ansi-dark --output ~/.dircolors
eval `dircolors ~/.dircolors`

setopt autocd              # change directory just by typing its name
setopt interactivecomments # allow comments in interactive mode
setopt magicequalsubst     # enable filename expansion for arguments of the form ‘anything=expression’
setopt nonomatch           # hide error message if there is no match for the pattern
setopt notify              # report the status of background jobs immediately
setopt numericglobsort     # sort filenames numerically when it makes sense
setopt promptsubst         # enable command substitution in prompt

WORDCHARS=${WORDCHARS//\/} # Don't consider certain characters part of the word

# hide EOL sign ('%')
PROMPT_EOL_MARK=""

# enable completion features
autoload -Uz compinit
compinit -d ~/.cache/zcompdump
zstyle ':completion:*:*:*:*:*' menu select
zstyle ':completion:*' auto-description 'specify: %d'
zstyle ':completion:*' completer _expand _complete
zstyle ':completion:*' format 'Completing %d'
zstyle ':completion:*' group-name ''
zstyle ':completion:*' list-colors ''
zstyle ':completion:*' list-prompt %SAt %p: Hit TAB for more, or the character to insert%s
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*' rehash true
zstyle ':completion:*' select-prompt %SScrolling active: current selection at %p%s
zstyle ':completion:*' use-compctl false
zstyle ':completion:*' verbose true
zstyle ':completion:*:kill:*' command 'ps -u $USER -o pid,%cpu,tty,cputime,cmd'

# History configurations
HISTFILE=~/.zsh_history
HISTSIZE=1000
SAVEHIST=2000
setopt hist_expire_dups_first # delete duplicates first when HISTFILE size exceeds HISTSIZE
setopt hist_ignore_dups       # ignore duplicated commands history list
setopt hist_ignore_space      # ignore commands that start with space
setopt hist_verify            # show command with history expansion to user before running it
#setopt share_history         # share command history data

# force zsh to show the complete history
alias history="history 0"

# configure `time` format
TIMEFMT=$'\nreal\t%E\nuser\t%U\nsys\t%S\ncpu\t%P'


force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
        color_prompt=yes
    else
        color_prompt=
    fi
fi



# enable auto-suggestions based on the history
if [ -f /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh ]; then
    . /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh
    # change suggestion color
    ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=#999'
fi

# enable command-not-found if installed
if [ -f /etc/zsh_command_not_found ]; then
    . /etc/zsh_command_not_found
fi



################################## Functions section ###########################################
precmd() {
    # Print the previously configured title
    print -Pnr -- "$TERM_TITLE"

    # Print a new line before the prompt, but only if it is not the first line
    if [ "$NEWLINE_BEFORE_PROMPT" = yes ]; then
        if [ -z "$_NEW_LINE_BEFORE_PROMPT" ]; then
            _NEW_LINE_BEFORE_PROMPT=1
        else
            print ""
        fi
    fi
}

# generate new SSH keys for github, run this u'll get the pub key copied to ur clipboard,just paste it
ghkey() {
    bash ~/.ssh/_gh_gen.sh
}

# terminate all conatainers
tercon() {
	for c in $(docker ps -a | tail -n+2 | awk '{print $1}'); do
  		docker stop "${c}" || :
  		docker rm "${c}"
	done
}

# remove all volumes
tervol() {
   docker volume rm $(docker volume ls -q)
}

# remove all images
terimg() {
   for img in $(docker images -q); do
        docker rmi "${img}" || :
    done
}


dprune() {
	 tercon && terimg && tervol
   docker container prune -f
   docker system prune -f
   docker image prune -f
   docker volume prune -f
}

# shows pretty `man` page.
man () {
  env \
    LESS_TERMCAP_mb=$(printf "\e[1;31m") \
    LESS_TERMCAP_md=$(printf "\e[1;31m") \
    LESS_TERMCAP_me=$(printf "\e[0m") \
    LESS_TERMCAP_se=$(printf "\e[0m") \
    LESS_TERMCAP_so=$(printf "\e[1;44;33m") \
    LESS_TERMCAP_ue=$(printf "\e[0m") \
    LESS_TERMCAP_us=$(printf "\e[1;32m") \
      man "$@"
}

# create a new directory & cd into it
mdd () {
 mkdir -p "$@" && cd "$@"
}

# encrypt a file with a passphrase
passenc() {
    local input_file=$1
    local output_file="${input_file}.gpg"
    if gpg --symmetric --cipher-algo AES256 --quiet --batch --yes --output "$output_file" "$input_file"; then
        shred -u "$input_file"
        echo -e "\e[1;32mEncrypted $input_file and saved as: $output_file\e[0m"
    else
        echo -e "\e[1;31mEncryption failed for $input_file\e[0m"
    fi
}

passdec() {
    local input_file=$1
    local output_file="${input_file%.gpg}"

    if gpg --use-agent --quiet --batch --yes --decrypt --cipher-algo AES256 --output "$output_file" "$input_file" 2>/dev/null; then
        shred -u "$input_file"
        echo -e "\e[1;32mDecrypted $input_file and saved as: $output_file\e[0m"
    else
        echo -e "\e[1;31mDecryption failed for $input_file\e[0m"
    fi
}


# copies the content of a file to the clipboard
cpf() {
    if [[ -n $1 && -f $1 ]]; then
        xclip -selection clipboard < $1
        echo -e "\e[1;32mContents of '$1' copied to clipboard.\e[0m"
    else
        echo "Usage: cpf <filename>"
    fi
}

# short for copy command, copies the output of the command to the clipboard
ccmd() {
    "$@" | xclip -selection clipboard
}

# When the gpg dameon fucking up, so you gotta lock in
loadpg() {
   pkill -9 gpg-agent
   export GPG_TTY=$(tty)
}

export MY_CURRENT_FUCKING_CITY=Tunis # TODO: Upgrade
weather() {
  LOCATION="${MY_CURRENT_FUCKING_CITY}"
    printf "%s" "$SEP1"
    if [ "$IDENTIFIER" = "unicode" ]; then
        printf "%s" "$(curl -s wttr.in/$LOCATION?format=1)"
    else
        printf "WEA %s" "$(curl -s wttr.in/$LOCATION?format=1 | grep -o "[0-9].*")"
    fi
    printf "%s\n" "$SEP2"
}
### Below was generated by the programs I'm installing from ./install/arbitrary/
eval "$(zoxide init zsh)"
eval "$(starship init zsh)"
export PATH="$HOME/miniconda3/bin:$PATH"
. /home/ashgw/miniconda3/etc/profile.d/conda.sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
# pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# go
export PATH=$PATH:/$HOME/go/bin
# Tfenv
export PATH="$HOME/.tfenv/bin:$PATH"
# Rust
export PATH="$HOME/.cargo/bin:$PATH"
# Poetry
export PATH="$HOME/.local/bin:$PATH"
# When GPG pwd verifcation screen doesn't show up on TTY
export GPG_TTY=/dev/pts/0
