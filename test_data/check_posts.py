import generate_history as g

print('authors', len(g.AUTHORS))
print('posts total', sum(len(g.POSTS.get(a['login'], [])) for a in g.AUTHORS))
print('unique posts', len({p for posts in g.POSTS.values() for p in posts}))
print('authors with posts', len([a for a in g.AUTHORS if g.POSTS.get(a['login'])]))
