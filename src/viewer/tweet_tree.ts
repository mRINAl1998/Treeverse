class AbstractTreeNode {
    children: Map<String, AbstractTreeNode>;

    constructor() {
        this.children = new Map<String, AbstractTreeNode>();
    }

    getId(): string {
        throw new Error('Not implemented');
    }

    toHierarchy() {
        return d3.hierarchy(this, (d: AbstractTreeNode) => Array.from(d.children.values()));
    }
}

class HasMoreNode extends AbstractTreeNode {
    parent: TweetNode;
    continuation: string;
    static ID = 'has_more';

    getId() {
        return HasMoreNode.ID;
    }

    constructor(parent: TweetNode, continuation: string) {
        super();
        this.parent = parent;
        this.continuation = continuation;
    }
}

class TweetNode extends AbstractTreeNode {
    tweet: Tweet;

    getId() {
        return this.tweet.id;
    }

    constructor(tweet: Tweet) {
        super();
        this.tweet = tweet;
    }

    private static addParent(parent: AbstractTreeNode, child: AbstractTreeNode) {
        if (!parent || !child) {
            return;
        }
        parent.children.set(child.getId(), child);
    }

    addChildrenFromContext(tweetContext: TweetContext) {
        for (let descentantGroup of tweetContext.descentants) {
            let parent: TweetNode = this;
            for (let descendant of descentantGroup) {
                var descendantNode = new TweetNode(descendant);
                TweetNode.addParent(parent, descendantNode);
                parent = descendantNode;
            }
        }

        this.children.delete(HasMoreNode.ID);
        if (tweetContext.has_more) {
            TweetNode.addParent(this, new HasMoreNode(this, tweetContext.continuation));
        }
    }

    static createFromContext(tweetContext: TweetContext): TweetNode {
        let root = null;
        let parent = null;
        for (let ancestor of tweetContext.ancestors) {
            var ancestorNode = new TweetNode(ancestor);
            if (!root) {
                root = ancestorNode;
            }
            this.addParent(parent, ancestorNode);
            parent = ancestor;
        }

        var contextTweetNode = new TweetNode(tweetContext.tweet);
        this.addParent(parent, contextTweetNode);
        contextTweetNode.addChildrenFromContext(tweetContext);

        if (!root) {
            root = contextTweetNode;
        }
        return root;
    }
}