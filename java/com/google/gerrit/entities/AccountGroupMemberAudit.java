// Copyright (C) 2009 The Android Open Source Project
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

package com.google.gerrit.entities;

import com.google.auto.value.AutoValue;
import com.google.errorprone.annotations.CanIgnoreReturnValue;
import java.time.Instant;
import java.util.Optional;

/** Membership of an {@link Account} in an {@link AccountGroup}. */
@AutoValue
public abstract class AccountGroupMemberAudit {
  public static Builder builder() {
    return new AutoValue_AccountGroupMemberAudit.Builder();
  }

  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder groupId(AccountGroup.Id groupId);

    public abstract Builder memberId(Account.Id accountId);

    public abstract Builder addedBy(Account.Id addedBy);

    abstract Account.Id addedBy();

    public abstract Builder addedOn(Instant addedOn);

    abstract Instant addedOn();

    abstract Builder removedBy(Account.Id removedBy);

    abstract Builder removedOn(Instant removedOn);

    @CanIgnoreReturnValue
    public Builder removed(Account.Id removedBy, Instant removedOn) {
      return removedBy(removedBy).removedOn(removedOn);
    }

    @CanIgnoreReturnValue
    public Builder removedLegacy() {
      return removed(addedBy(), addedOn());
    }

    public abstract AccountGroupMemberAudit build();
  }

  public abstract AccountGroup.Id groupId();

  public abstract Account.Id memberId();

  public abstract Account.Id addedBy();

  public abstract Instant addedOn();

  public abstract Optional<Account.Id> removedBy();

  public abstract Optional<Instant> removedOn();

  public abstract Builder toBuilder();

  public boolean isActive() {
    return !removedOn().isPresent();
  }
}
