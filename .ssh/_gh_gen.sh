# Just paste the key G
ssh-keygen -t ed25519 -f ~/.ssh/id_github
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_github
xclip -sel clip < ~/.ssh/id_github.pub