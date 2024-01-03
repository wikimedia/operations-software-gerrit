// Copyright (C) 2020 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.server.git.validators;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterables;
import com.google.gerrit.entities.Change;
import com.google.gerrit.entities.Comment;
import com.google.gerrit.entities.Project;
import com.google.gerrit.extensions.validators.CommentForValidation;
import com.google.gerrit.extensions.validators.CommentValidationContext;
import com.google.gerrit.extensions.validators.CommentValidationFailure;
import com.google.gerrit.extensions.validators.CommentValidator;
import com.google.gerrit.server.config.GerritServerConfig;
import com.google.gerrit.server.notedb.ChangeNotes;
import com.google.inject.Inject;
import java.util.stream.Stream;
import org.eclipse.jgit.lib.Config;

/**
 * Limits the total size of all comments and change messages to prevent space/time complexity
 * issues. Note that autogenerated change messages are not subject to validation. However, we still
 * count autogenerated messages for the limit (which will be notified on a further comment).
 */
public class CommentCumulativeSizeValidator implements CommentValidator {
  public static final int DEFAULT_CUMULATIVE_COMMENT_SIZE_LIMIT = 3 << 20;

  private final int maxCumulativeSize;
  private final ChangeNotes.Factory notesFactory;

  @Inject
  CommentCumulativeSizeValidator(
      @GerritServerConfig Config serverConfig, ChangeNotes.Factory notesFactory) {
    this.notesFactory = notesFactory;
    maxCumulativeSize =
        serverConfig.getInt(
            "change", "cumulativeCommentSizeLimit", DEFAULT_CUMULATIVE_COMMENT_SIZE_LIMIT);
  }

  @Override
  public ImmutableList<CommentValidationFailure> validateComments(
      CommentValidationContext ctx, ImmutableList<CommentForValidation> comments) {
    ChangeNotes notes =
        notesFactory.createChecked(Project.nameKey(ctx.getProject()), Change.id(ctx.getChangeId()));
    int existingCumulativeSize =
        Stream.concat(
                    notes.getHumanComments().values().stream(),
                    notes.getRobotComments().values().stream())
                .mapToInt(Comment::getApproximateSize)
                .sum()
            + notes.getChangeMessages().stream().mapToInt(cm -> cm.getMessage().length()).sum();
    int newCumulativeSize =
        comments.stream().mapToInt(CommentForValidation::getApproximateSize).sum();
    ImmutableList.Builder<CommentValidationFailure> failures = ImmutableList.builder();
    if (!comments.isEmpty() && !isEnoughSpace(notes, newCumulativeSize, maxCumulativeSize)) {
      // This warning really applies to the set of all comments, but we need to pick one to attach
      // the message to.
      CommentForValidation commentForFailureMessage = Iterables.getLast(comments);

      failures.add(
          commentForFailureMessage.failValidation(
              String.format(
                  "Exceeding maximum cumulative size of comments and change messages:"
                      + " %d (existing) + %d (new) > %d",
                  existingCumulativeSize, newCumulativeSize, maxCumulativeSize)));
    }
    return failures.build();
  }

  /**
   * Returns {@code true} if there is available space and the new size that we wish to add is less
   * than the maximum allowed size. {@code false} otherwise (if there is not enough space).
   */
  public static boolean isEnoughSpace(ChangeNotes notes, int addedBytes, int maxCumulativeSize) {
    int existingCumulativeSize =
        Stream.concat(
                    notes.getHumanComments().values().stream(),
                    notes.getRobotComments().values().stream())
                .mapToInt(Comment::getApproximateSize)
                .sum()
            + notes.getChangeMessages().stream().mapToInt(cm -> cm.getMessage().length()).sum();
    return existingCumulativeSize + addedBytes < maxCumulativeSize;
  }
}
