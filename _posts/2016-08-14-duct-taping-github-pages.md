---
layout: post
title:  "Duct-Taping GitHub Pages"
date:   2016-08-14 10:34:03 -0400
---

<p class="lead">Batteries included can serve you well, but sometimes you just want more control.</p>

GitHub Pages provides an easy, free way to host a website.
However there are two flavours in which you can use GitHub pages, the [manually](https://help.github.com/articles/using-a-static-site-generator-other-than-jekyll/) way, or the [batteries included](https://help.github.com/articles/about-github-pages-and-jekyll/) way.

The batteries included way is dead simple.
Using the open-source static site generator [Jekyll](https://jekyllrb.com/), GitHub will generate and deploy your site on push to `master` (or `gh-pages` if on project page).
This is a great solution that allow users to get up and running with a site quickly, but has some limitations.
Namely the ability to heavily customize your site.

Suppose I wanted to modify Jekyll to generate blog posts from [Jupyter Notebooks](http://jupyter.org/).
I could modify the Jekyll codebase, or write a plugin that could render the notebooks into blog posts.
This would work locally, but since the batteries included method doesn't run any custom code, I would have no way of deploying.
For that reason I wrote a script to managed the deploys of my site manually.

The principle is to keep your code and build branches clean and separated from each other while having meaningful links and relations guaranteed.
It allows you to customize the build of your site as much as you want while keeping the simplicity of GitHub pages.

Here's what I came up with:

```sh
#!/bin/sh
set -e

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "jekyll" ]; then
    echo "ERROR! You can only deploy from jekyll branch"
    exit 1
fi

CLEAN_REPO=$(git status --porcelain)
if [ -n "$CLEAN_REPO" ]; then
    echo "ERROR! Untracked changes in the repo, commit all changes before deploying"
    exit 2
fi

UNPUSHED_COMMITS=$(git cherry -v)
if [ -n "$UNPUSHED_COMMITS" ]; then
    echo "ERROR! Unpushed commits on jekyll branch. Please push all commits before deploying"
    exit 3
fi

CURRENT_SHA=$(git rev-parse HEAD)

echo ""
echo "=> Setting up clean build directory <="
echo ""
rm -rf _site
git clone -b master git@github.com:thmsmlr/thmsmlr.github.io.git _site

pushd _site
rm -rf $(git ls-tree --name-only master)
popd

echo ""
echo "=> Building site <="
echo ""
jekyll build
pushd _site
git aa
git commit -m "`date` ($CURRENT_SHA)"

echo ""
echo "=> Deploying site <="
echo ""
git push origin master
popd

echo ""
echo "=> Cleaning up <="
echo ""
rm -rf _site
```

**NOTE:** *that since I was building a [user site](https://help.github.com/articles/user-organization-and-project-pages/), the GitHub Pages branch was the `master` branch, my HEAD and code branch was the `jekyll` branch*

I had three goals with this script:

1. Each deploy should only have build files, no Jekyll code allowed!
2. Each build should link to the code commit from which it was generated
3. Code commits and build commits should always be in sync

To achieve the first goal, I had to make a orphaned `master` branch which represented the lineage of compiled, deployed assets.
On deploy, the script would clone the `master` branch into the build directory `_site/`, nuke the current build, build the new site, commit the changes and push.
This would make sure that only the build in the `_site/` directory would get pushed to master.
Furthermore, since it clones the repository on each build and nukes the files, this method ensures that we get clean diffs of what changed between builds.

For the second goal, I took advantage of the fact that GitHub does [auto-linking](https://help.github.com/articles/autolinked-references-and-urls/#commit-shas) of commits, issues, and pull requests.
When the script pushes the new build to master, it does so with a commit message that contains the SHA of the latest code on the `jekyll` branch.
GitHub will automatically turn that into a link when viewing the code on their website.

![GitHub Deploy Commit Message](/assets/github-deploy-commit-message.png)

Finally, we make sure the commits are always sync'd by enforcing that there are no uncommitted changes in the `jekyll` branch before deploying.
Obviously you can manually mess things up, but it's a good enough for now.

This script will allow me to customize and complicate the build my site while maintaining some sanity in my builds.
Feel free to use this script as a basis for your own GitHub pages deployment, you'll probably need to modify it quite heavily for your use case, but I think the idea behind it is simple enough.

Hope you find it useful.

