# Just paste the key G
ssh-keygen -t ed25519 -f ~/.ssh/github
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github
xclip -sel clip < ~/.ssh/github.pub