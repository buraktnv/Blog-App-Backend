const router = require("express").Router();
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const auth = require("../middleware/auth");
const User = require("../models/userModel");

const routes = {
  getPosts: "/get-posts",
  createBlogPost: "/create-blog-post",
  getPost: "/get-post",
  updatePost: "/update-blog-post",
  userPosts: "/get-user-posts",
  likePost: "/like-post",
  commentPost: "/comment-post",
  deleteComment: "/delete-comment",
  getComments: "/get-comments",
};

router.post(routes.userPosts, auth, async (req, res) => {
  try {
    const userPosts = await Post.find({ author: req.user._id });
    res.json(userPosts);
  } catch (err) {
    return res.json(err);
  }
});

router.post(routes.getPosts, async (req, res) => {
  const time = new Date().getTime();
  try {
    let { limit = 6 } = req.body;

    const posts = await Post.find({ publishAt: { $lte: time } })
      .sort({ _id: -1 })
      .limit(limit);
    res.json(posts);
  } catch (error) {
    res.json({ err: error });
  }
});

router.post(routes.updatePost, auth, async (req, res) => {
  let { id, title, description, content } = req.body;
  try {
    let post = await Post.findById(id).select("+author");
    post.title = title;
    post.description = description;
    post.content = content;

    if (post.author + "" !== req.user._id + "") return res.sendStatus(401);
    const updatedPost = await post.save();
    res.json({ succes: true });
  } catch (err) {
    res.json(err);
  }
});

router.post(routes.getPost, async (req, res) => {
  let { id } = req.body;

  if (!id) {
    res.json({ err: "You should enter the id!" });
  }
  try {
    const post = await Post.findById(id);
    res.json(post);
  } catch (error) {
    res.json({ err: error });
  }
});
router.post(routes.createBlogPost, auth, async (req, res) => {
  try {
    let { image, title, description, content, cathegory, tag, publishAt } =
      req.body;

    if (!title || !content || !description)
      return res.json({ err: "You should fill the text area or title! " });

    const post = new Post({
      image,
      title,
      description,
      content,
      cathegory,
      tag,
      publishAt,
      authorName: req.user.userName,
      author: req.user._id,
    });

    const postRes = await post.save();
    res.json(true);
  } catch (error) {
    res.json({ err: error });
  }
});

router.post(routes.likePost, auth, async (req, res) => {
  let { postId } = req.body;
  try {
    let post = await Post.findById(postId);
    if (post.likes.includes(req.user._id)) {
      post.likes = post.likes.filter(
        (item) => String(item) !== String(req.user._id)
      );
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.sendStatus(200);
  } catch (error) {
    res.json({ error });
  }
});

router.post(routes.commentPost, auth, async (req, res) => {
  let { content } = req.body;
  try {
    const comment = new Comment({
      author: req.user._id,
      content,
    });

    const commentRes = await comment.save();

    console.log(commentRes);

    const post = await Post.findById(postId).select("comments");
    post.comments.push(commentRes._id);

    console.log(post);
    await post.save();
  } catch (error) {
    res.json(error);
  }
});

router.post(routes.deleteComment, async (req, res) => {
  let { commentId, postId } = req.body;
  try {
    const comment = await Comment.findById(commentId);
    const post = await Post.findById(comment.post).select("comments");

    post.comments = post.comments.filter(
      (item) => String(item) !== String(comment._id)
    );
    await comment.delete();

    await post.save();

    res.sendStatus(200);
  } catch (error) {
    res.json(error);
  }
});

router.post(routes.getComments, async (req, res) => {
  let { postId } = req.body;
  try {
    // Get Post and populate Comments and populate authors
    const comments = await Post.findById(postId)
      .populate({
        path: "comments",
        model: Comment,
        populate: {
          path: "author",
          model: User,
          select: ["userName", "profilePhoto"],
        },
      })
      .select("comments");

    res.json(comments);
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;
