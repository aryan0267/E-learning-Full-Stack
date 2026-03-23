package com.elearning.backend.service;

import com.elearning.backend.dto.NotificationDTO;
import com.elearning.backend.mapper.NotificationMapper;
import com.elearning.backend.entity.Notification;
import com.elearning.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import java.util.List;

import lombok.extern.slf4j.Slf4j; // Import the Lombok Slf4j annotation

@Service
@Slf4j
public class NotificationService {
    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    public List<NotificationDTO> listForUser(Long userId) {
        log.info("Fetching all notifications for user ID: {}", userId);
        return repo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(NotificationMapper::toDto).toList();
    }

    public Long unreadCount(Long userId) {
        Long count = repo.countByUserIdAndReadFalse(userId);
        log.info("Unread notification count for user ID {} is: {}", userId, count);
        return count;
    }

    public NotificationDTO create(NotificationDTO dto) {
        log.info("Creating new notification of type: {} for user ID: {}", dto.getType(), dto.getUserId());
        Notification saved = repo.save(NotificationMapper.toEntity(dto));
        log.debug("Notification created successfully with ID: {}", saved.getId());
        return NotificationMapper.toDto(saved);
    }

    public NotificationDTO markRead(Long id) {
        log.info("Attempting to mark notification ID: {} as read.", id);
        Notification n = repo.findById(id).orElseThrow();
        n.setRead(true);
        NotificationDTO updatedDto = NotificationMapper.toDto(repo.save(n));
        log.debug("Notification ID: {} successfully marked as read.", id);
        return updatedDto;
    }
}