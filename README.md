### On a fresh machine

run

```shell
bash <(curl -L https://ashgw.me/api/v1/bootstrap)
```
> This setup is platform agnostic.

Actually, if you're not on Debian, install  Git, Zsh, and xz (hopefully no [backdoor](https://en.wikipedia.org/wiki/XZ_Utils_backdoor) this time) with your native package manager. Then, run the script. It uses [Nix](https://nixos.org/) to install all the other [packages](https://search.nixos.org/packages). The rest of the setup is automatic (just follow the instructions). I myself use raw Debian, and according to the [Dunning-Kruger effect](https://en.wikipedia.org/wiki/Dunning%E2%80%93Kruger_effect)

![kruger](https://github-production-user-asset-6210df.s3.amazonaws.com/126174609/333013594-ceaf6b9f-2d67-4fb8-89b1-51e1a746c77c.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20240523%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240523T022843Z&X-Amz-Expires=300&X-Amz-Signature=6715084f6a03101580b34a5c0f7b32e1f8c8faad6fdc9aaa3afccbe31023946f&X-Amz-SignedHeaders=host&actor_id=126174609&key_id=0&repo_id=723693556)

I'm currently on the slope of enlightenment.


Developer workflow:

1-   Shit ton of aliases, even aliasing the aliases, ion like mental overhead, if it takes more than 3 words to type it => alias it. So  I casually type random shit like
```shell
dprune && lpg && g ck -b dev && j t && j l && v . && c && gh
```

 2- 0 rice
 
 3- Neovim, tmux & fzf? Yes

![ricer](https://github-production-user-asset-6210df.s3.amazonaws.com/126174609/333017800-ad61b85b-b564-45bc-ac1b-65d97509ad74.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20240523%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240523T025355Z&X-Amz-Expires=300&X-Amz-Signature=53f097429e9252ca52ca94fda3433de980d5d6c49ae2d7ac64e22340aa35fc90&X-Amz-SignedHeaders=host&actor_id=126174609&key_id=0&repo_id=723693556)
